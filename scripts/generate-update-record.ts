/**
 * generate-update-record.ts
 *
 * 从一次已合并的 PR 元数据生成 `content/update-record/*.mdx` 草稿条目。
 * 设计目标：消掉「手写更新日志」的摩擦，同时保留人工把关——
 *   本脚本只负责产出一份**草稿文件**，由 GitHub Action 开 PR 供人工润色后合并。
 *
 * 输入（全部来自环境变量，便于本地 dry-run 与 CI 复用）：
 *   PR_NUMBER   合并的 PR 编号
 *   PR_TITLE    PR 标题
 *   PR_BODY     PR 描述（多行）
 *   PR_LABELS   PR 标签 JSON 数组，如 '["feature","fix"]'
 *   MERGED_AT   PR 合并时间 ISO 字符串（用于 date 字段）
 *   COMMITS     合并包含的提交主题 JSON 数组，如 '["feat: x","fix: y"]'
 *
 * 运行：
 *   npx tsx scripts/generate-update-record.ts            # 写盘
 *   npx tsx scripts/generate-update-record.ts --dry-run # 仅打印，不落盘
 *
 * 输出兼容性：完全对齐 lib/updateRecord.ts 的解析约定
 *   - frontmatter：title / date("YYYY-MM-DD") / category / version
 *   - 文件名即 slug：`<date>-<version>.mdx`
 *   - date 字段必须可被 `new Date()` 解析，供降序排序
 */
import fs from "fs";
import path from "path";
import { glob } from "glob";

const updateRecordDir = path.join(process.cwd(), "content", "update-record");

interface Inputs {
  prNumber: string;
  prTitle: string;
  prBody: string;
  prLabels: string[];
  mergedAt: string;
  commits: string[];
}

function parseInputs(): Inputs {
  let prLabels: string[] = [];
  if (process.env.PR_LABELS) {
    try {
      const parsed = JSON.parse(process.env.PR_LABELS);
      if (Array.isArray(parsed)) prLabels = parsed.map(String);
    } catch {
      /* 非 JSON 时忽略，回退空数组 */
    }
  }

  let commits: string[] = [];
  if (process.env.COMMITS) {
    try {
      const parsed = JSON.parse(process.env.COMMITS);
      if (Array.isArray(parsed)) commits = parsed.map(String);
    } catch {
      // 退化：按换行拆分
      commits = process.env.COMMITS.split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return {
    prNumber: process.env.PR_NUMBER || "0",
    prTitle: (process.env.PR_TITLE || "").trim() || "未命名变更",
    prBody: process.env.PR_BODY || "",
    prLabels,
    mergedAt: process.env.MERGED_AT || new Date().toISOString(),
    commits,
  };
}

/** PR 标签 → 更新日志 category（与现有条目风格一致，缺省 update） */
function categoryFromLabels(labels: string[]): string {
  const set = new Set(labels.map((l) => l.toLowerCase()));
  if (set.has("feature") || set.has("feat") || set.has("enhancement")) return "feature";
  if (set.has("fix") || set.has("bug") || set.has("bugfix")) return "fix";
  if (set.has("docs")) return "docs";
  return "update";
}

/** 扫描现有条目，返回最高语义版本号 */
function getLatestVersion(): { major: number; minor: number; patch: number } | null {
  if (!fs.existsSync(updateRecordDir)) return null;
  const files = glob.sync("*.mdx", { cwd: updateRecordDir });
  let best: { major: number; minor: number; patch: number } | null = null;
  for (const f of files) {
    const m = f.match(/v(\d+)\.(\d+)\.(\d+)/);
    if (!m) continue;
    const v = { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
    if (
      !best ||
      v.major > best.major ||
      (v.major === best.major && v.minor > best.minor) ||
      (v.major === best.major && v.minor === best.minor && v.patch > best.patch)
    ) {
      best = v;
    }
  }
  return best;
}

/** 版本号自动 patch bump（具体里程碑语义由人工在 PR 润色时调整） */
function nextVersion(): string {
  const latest = getLatestVersion();
  if (!latest) return "v1.0.0";
  return `v${latest.major}.${latest.minor}.${latest.patch + 1}`;
}

/** ISO → YYYY-MM-DD（UTC，避免时区导致跨日错位） */
function dateFromIso(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// 自动润色：参照现代国产定制 Android 系统（HyperOS / ColorOS / OriginOS）更新日志
// 的呈现方式——按 conventional-commit 前缀把提交归到 🆕新增 / ✨优化 / 🐛修复 / 🔧其他
// 四类，正文用「用户能感知的好处」组织，技术细节下沉到「其他」。
// 草稿仍是草稿：总括句留给人工补一句人话，但骨架已直接是 ROM 风，润色成本很低。
// ---------------------------------------------------------------------------
type CatKey = 'feature' | 'fix' | 'perf' | 'other';

const CAT_META: Record<CatKey, { emoji: string; heading: string }> = {
  feature: { emoji: '🆕', heading: '🆕 新增' },
  fix: { emoji: '🐛', heading: '🐛 修复' },
  perf: { emoji: '✨', heading: '✨ 优化' },
  other: { emoji: '🔧', heading: '🔧 其他' },
};

const CAT_ORDER: CatKey[] = ['feature', 'fix', 'perf', 'other'];

/** 按提交前缀自动归类（含中文关键词兜底） */
function classifyCommit(c: string): CatKey {
  const s = c.toLowerCase();
  if (/^(feat|feature|enhancement)/.test(s)) return 'feature';
  if (/^(fix|bug|bugfix|hotfix)/.test(s)) return 'fix';
  if (/^(perf|optimize|optimise|refactor|style|improve)/.test(s)) return 'perf';
  if (/^(chore|docs|test|ci|build|deps)/.test(s)) return 'other';
  if (/(修复|修)/.test(c)) return 'fix';
  if (/(新增|添加|增加)/.test(c)) return 'feature';
  if (/(优化|改进|提升)/.test(c)) return 'perf';
  return 'other';
}

/** 去掉 conventional-commit 前缀（feat(bili): xxx → xxx），保留人话部分 */
function cleanCommit(c: string): string {
  return (
    c
      .replace(
        /^(feat|feature|fix|bugfix|hotfix|perf|optimize|optimise|refactor|style|chore|docs|test|ci|build|deps)(\([^)]*\))?:\s*/i,
        '',
      )
      .trim() || c
  );
}

/** 统计提交分类，返回出现最多的类别（用于卡片 emoji） */
function dominantCategory(commits: string[]): CatKey {
  const count: Record<CatKey, number> = { feature: 0, fix: 0, perf: 0, other: 0 };
  for (const c of commits) count[classifyCommit(c)] += 1;
  let best: CatKey = 'feature';
  for (const k of CAT_ORDER) if (count[k] > count[best]) best = k;
  return best;
}

function buildMdx(
  input: Inputs,
  category: string,
  version: string,
  date: string,
): string {
  const title = input.prTitle;

  // 按前缀自动归类到 ROM 风格四类
  const grouped: Record<CatKey, string[]> = { feature: [], fix: [], perf: [], other: [] };
  for (const c of input.commits) grouped[classifyCommit(c)].push(cleanCommit(c));

  const emoji = CAT_META[dominantCategory(input.commits)].emoji;

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `date: "${date}"`,
    `category: "${category}"`,
    `version: "${version}"`,
    `emoji: "${emoji}"`,
    "---",
    "",
  ].join("\n");

  const sections: string[] = [];

  // 总括句：留给人工填一句用户视角的总结
  sections.push(
    `> 本次更新：_（一句话总括这次更新为用户带来的变化，例如「上线了行业数据查询工具，并让投稿列表加载更稳更快」）_`,
    "",
  );

  // PR 描述作为背景补充（可选，截断避免臃肿）
  const bodyLines = input.prBody
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20);
  if (bodyLines.length) {
    sections.push(...bodyLines, "");
  }

  // 分类条目（仅输出非空类别，顺序 新增→修复→优化→其他）
  for (const key of CAT_ORDER) {
    const items = grouped[key];
    if (!items.length) continue;
    sections.push(`### ${CAT_META[key].heading}`);
    sections.push(...items.map((it) => `- ${it}`), "");
  }

  sections.push(
    "",
    "> 本条目由 update-record 自动化草稿生成，请人工润色叙事与版本号后再合并。",
    "",
  );

  return frontmatter + sections.join("\n");
}

function main() {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const input = parseInputs();
  const category = categoryFromLabels(input.prLabels);
  const version = nextVersion();
  const date = dateFromIso(input.mergedAt);
  const mdx = buildMdx(input, category, version, date);
  const filename = `${date}-${version}.mdx`;

  if (dryRun) {
    console.log("--- DRY RUN ---");
    console.log("filename:", filename);
    console.log("category:", category);
    console.log("--------------");
    console.log(mdx);
    return;
  }

  fs.mkdirSync(updateRecordDir, { recursive: true });
  const outPath = path.join(updateRecordDir, filename);
  if (fs.existsSync(outPath)) {
    console.error(`目标文件已存在，跳过写入避免覆盖：${filename}`);
    process.exit(1);
  }
  fs.writeFileSync(outPath, mdx, "utf-8");
  console.log("WROTE", filename);
}

main();
