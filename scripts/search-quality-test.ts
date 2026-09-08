/**
 * search-quality-test.ts - 搜索质量测试集（两层结构）
 * ================================================
 *
 * 对应搜索管线的「实测」环节（优先级①）。
 * 不依赖 UI，复用 search-utils 的真实逻辑，对预定义 Query 跑搜索，
 * 输出结构化报告。测试分两层，职责明确不混：
 *
 * 第一层 · Pipeline Smoke / Regression（回归保护）
 *   验证「管线通不通」：sanitize → index → search → enrich → 结果数量 不崩溃，
 *   以及 sanitizeQuery 是否误杀边界 Query / 漏放垃圾 Query。
 *   断言：结果数量是否符合类别预期（有结果 / 无结果 / 被拒绝 / 不被误杀）。
 *
 * 第二层 · 排序断言（质量校验）
 *   验证「排序对不对」：
 *     - expectedTop：断言 Top1 标题命中预期关键词（标题命中 > 正文命中）
 *     - titleBeatsBody：受控 mini 索引，显式验证标题命中排在正文命中之前
 *
 * 注意：FlexSearch 0.8 不暴露真实 BM25 分数，extractScoredResults 返回的
 *   score 是「位置代理分」（见 search-utils.ts 注释），故本测试不做绝对分数
 *   阈值断言，只断言「排序的先后顺序」是否符合预期。
 *
 * 用法：
 *   npm run search-test
 *   npx tsx scripts/search-quality-test.ts
 */

import fs from 'fs';
import path from 'path';
import type { PostIndexItem } from '../lib/content';
import {
  sanitizeQuery,
  createEnrichedDocument,
  addDocToIndex,
  extractScoredResults,
} from '../lib/content';

// ==================== 数据加载 ====================

/**
 * 直读 data/posts.json，避免 import lib/content/posts。
 * posts.ts 顶部带 'server-only' 守卫，Node 脚本（tsx）加载会直接 throw，
 * 因此本测试绕过它，把 data/posts.json 视为输入快照。
 * data/posts.json 由 prebuild / generate-index / dev 生成。
 */
function loadPosts(): PostIndexItem[] {
  const indexFile = path.join(process.cwd(), 'data/posts.json');
  if (!fs.existsSync(indexFile)) {
    throw new Error(
      'data/posts.json 不存在，请先运行 npm run generate-index（或 npm run dev / build）',
    );
  }
  const data = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
  const posts = (data.posts ?? data) as PostIndexItem[];
  if (!posts || posts.length === 0) {
    throw new Error('data/posts.json 为空，无法构建测试索引');
  }
  return posts;
}

// ==================== 测试集定义 ====================

interface TestCase {
  /** 查询词 */
  query: string;
  /** 期望类别（第一层 smoke 断言） */
  category: 'normal' | 'boundary' | 'garbage' | 'nonexistent';
  /**
   * 第二层排序断言：期望 Top1 的标题至少命中这些关键词之一（不区分大小写）。
   * 不填 → 只做第一层 smoke 断言（有结果 / 无结果 / 不被误杀）。
   */
  expectedTop?: string[];
}

const TEST_CASES: TestCase[] = [
  // ---- 正常 Query · 标题命中（第二层：断言 Top1 标题 = 预期关键词）----
  { query: '原神', category: 'normal', expectedTop: ['原神'] },
  { query: 'Markdown', category: 'normal', expectedTop: ['Markdown'] },
  { query: '明日方舟', category: 'normal', expectedTop: ['明日方舟'] },
  { query: '博客', category: 'normal', expectedTop: ['博客'] },
  { query: '轻薄本', category: 'normal', expectedTop: ['轻薄本'] },

  // ---- 正常 Query · 非标题命中（第一层：只断言有结果，不断言具体 Top1）----
  // Windows 只出现在「从轻薄本到生产力工具」的 tags 里，标题不含，
  // 故不加 expectedTop——这类 Query 无法断言「标题命中 > 正文命中」。
  { query: 'Windows', category: 'normal' },

  // ---- 边界 Query ---- 不应被 sanitizeQuery 误判为垃圾（只校验不被拒绝，不要求有结果）
  { query: '404', category: 'boundary' },
  { query: '2026', category: 'boundary' },
  { query: '3D', category: 'boundary' },
  { query: '11', category: 'boundary' },
  { query: 'C++', category: 'boundary' },
  { query: 'Node.js', category: 'boundary' },

  // ---- 垃圾 Query ---- sanitizeQuery 应拒绝（valid=false）
  { query: '11111111', category: 'garbage' },
  { query: 'aaaaaaaa', category: 'garbage' },
  { query: '???????', category: 'garbage' },
  { query: '!!!!!!!!', category: 'garbage' },
  { query: '........', category: 'garbage' },

  // ---- 不存在 Query ---- 正常搜索后应为 0 结果
  { query: 'xxyyzz123notexist', category: 'nonexistent' },
];

// ==================== 第一层：Pipeline Smoke 断言 ====================

const SMOKE_EXPECTATIONS: Record<TestCase['category'], (r: TestResult) => boolean> = {
  normal: (r) => r.resultCount > 0,
  boundary: (r) => r.sanitizedValid === true, // 不被误杀
  garbage: (r) => r.sanitizedValid === false, // 必须被拒绝
  nonexistent: (r) => r.resultCount === 0,
};

// ==================== 结果类型 ====================

interface TestResult {
  query: string;
  category: TestCase['category'];
  /** sanitizeQuery 判定是否有效 */
  sanitizedValid: boolean;
  /** 搜索命中数量 */
  resultCount: number;
  /** Top3 结果标题 + score（score 为位置代理分，仅作参考） */
  topResults: { title: string; score: number }[];
}

// ==================== 第二层：排序断言 ====================

/** 断言 Top1 标题命中 expectedTop 关键词之一（不区分大小写） */
function rankingPass(tc: TestCase, r: TestResult): boolean {
  if (!tc.expectedTop || tc.expectedTop.length === 0) return true;
  const topTitle = r.topResults[0]?.title ?? '';
  return tc.expectedTop.some((keyword) =>
    topTitle.toLowerCase().includes(keyword.toLowerCase()),
  );
}

/**
 * 第二层 · 受控排序断言：标题命中 > 正文命中
 *
 * 真实语料里多数关键词要么只命中一篇、要么多篇都命中标题，
 * 难以构造「一篇标题命中 vs 另一篇仅正文命中」的天然对照。
 * 这里用受控 mini 索引显式验证：把同一关键词分别放在
 * 「标题（content 头部）」与「正文（content 中后部）」，
 * 断言标题命中那篇排在正文命中之前。
 * 该行为依赖 FlexSearch 对「content 头部（title）命中」的天然加权，
 * 也是当前引擎「标题 > 正文」的实现机制，故纳入回归保护。
 */
function titleBeatsBody(): { pass: boolean; detail: string } {
  const doc = createEnrichedDocument({ storeFields: ['title'] });
  const titleMap = new Map<string, string>();

  const entries = [
    { id: 'body-only', title: '无关标题', body: '这是一篇普通随笔，正文里顺带提到 React 这个词' },
    { id: 'title-hit', title: 'React 入门指南', body: '一些正文内容，与标题无关' },
  ];

  for (const e of entries) {
    titleMap.set(e.id, e.title);
    // 与 buildIndex 相同的拼接方式：title 在前，body 在后
    addDocToIndex(doc, e.id, `${e.title} ${e.body}`, { title: e.title });
  }

  const raw = doc.search('React', { limit: 10, enrich: true });
  const scored = extractScoredResults<string>(raw);
  const topId = scored[0]?.id;

  return {
    pass: topId === 'title-hit',
    detail: `Top1 = ${titleMap.get(topId ?? '') ?? topId ?? '(无结果)'}`,
  };
}

// ==================== 主流程 ====================

function buildIndex(posts: PostIndexItem[]) {
  const doc = createEnrichedDocument({
    storeFields: ['title', 'summary', 'tags'],
  });
  const titleMap = new Map<string, string>();

  posts.forEach((post) => {
    titleMap.set(post.slug, post.title);
    addDocToIndex(
      doc,
      post.slug,
      `${post.title} ${post.summary} ${(post.tags || []).join(' ')}`,
      {
        title: post.title,
        summary: post.summary,
        tags: post.tags || [],
      },
    );
  });

  return { doc, titleMap };
}

function runTest(
  query: string,
  doc: ReturnType<typeof createEnrichedDocument>,
  titleMap: Map<string, string>,
): Omit<TestResult, 'category'> {
  // 1. 输入层：sanitizeQuery
  const { valid } = sanitizeQuery(query);

  if (!valid) {
    return { query, sanitizedValid: false, resultCount: 0, topResults: [] };
  }

  // 2. 引擎层：搜索 + enrich
  const raw = doc.search(query, { limit: 20, enrich: true });
  const scored = extractScoredResults<string>(raw);

  const topResults = scored.slice(0, 3).map(({ id, score }) => ({
    title: titleMap.get(id) ?? id,
    score: Number(score.toFixed(3)),
  }));

  return { query, sanitizedValid: true, resultCount: scored.length, topResults };
}

// ==================== 报告渲染 ====================

interface CaseReport extends TestResult {
  expectedTop?: string[];
  smokePass: boolean;
  rankPass: boolean;
  pass: boolean;
}

function renderReport(cases: CaseReport[], titleVsBody: { pass: boolean; detail: string }): void {
  const CATEGORY_LABELS: Record<TestCase['category'], string> = {
    normal: '正常',
    boundary: '边界',
    garbage: '垃圾',
    nonexistent: '不存在',
  };

  console.log('\n=== 搜索质量测试报告 ===\n');

  console.log(
    `${'Query'.padEnd(18)} ${'类别'.padEnd(6)} ${'sanitize'.padEnd(9)} ${'命中'.padEnd(5)} ${'Smoke'.padEnd(6)} ${'Rank'.padEnd(6)} Top1 标题`,
  );
  console.log('-'.repeat(104));

  for (const r of cases) {
    const sanitizeStr = r.sanitizedValid ? 'pass' : 'REJECT';
    const smokeStr = r.smokePass ? 'OK' : 'FAIL';
    const rankStr = r.expectedTop ? (r.rankPass ? 'OK' : 'FAIL') : '-';
    const topTitle = r.topResults[0]?.title ?? '(无结果)';

    console.log(
      `${r.query.padEnd(18)} ${CATEGORY_LABELS[r.category].padEnd(6)} ${sanitizeStr.padEnd(9)} ${String(r.resultCount).padEnd(5)} ${smokeStr.padEnd(6)} ${rankStr.padEnd(6)} ${topTitle.slice(0, 40)}`,
    );
  }

  console.log('-'.repeat(104));

  // 第一层汇总
  const smokePassed = cases.filter((c) => c.smokePass).length;
  console.log(`\n[第一层 · Pipeline Smoke]   ${smokePassed}/${cases.length} 通过`);

  // 第二层汇总：仅统计带 expectedTop 的用例
  const rankCases = cases.filter((c) => c.expectedTop && c.expectedTop.length > 0);
  const rankPassed = rankCases.filter((c) => c.rankPass).length;
  console.log(
    `[第二层 · 排序断言]        ${rankPassed}/${rankCases.length} 通过（标题命中）`,
  );
  console.log(
    `[第二层 · 标题>正文]       ${titleVsBody.pass ? 'OK' : 'FAIL'}  ${titleVsBody.detail}`,
  );

  console.log('');
}

// ==================== 入口 ====================

function main(): void {
  const posts = loadPosts();
  const { doc, titleMap } = buildIndex(posts);

  const cases: CaseReport[] = TEST_CASES.map((tc) => {
    const base = runTest(tc.query, doc, titleMap);
    const result: TestResult = { ...base, category: tc.category };
    const smokePass = SMOKE_EXPECTATIONS[tc.category](result);
    const rankPass = rankingPass(tc, result);

    return {
      ...result,
      expectedTop: tc.expectedTop,
      smokePass,
      rankPass,
      pass: smokePass && rankPass,
    };
  });

  const titleVsBody = titleBeatsBody();

  renderReport(cases, titleVsBody);

  // 非 0 退出码便于 CI / 脚本判断（任一断言失败即失败）
  const failed =
    cases.filter((c) => !c.pass).length + (titleVsBody.pass ? 0 : 1);
  process.exit(failed > 0 ? 1 : 0);
}

main();
