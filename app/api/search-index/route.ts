import { NextResponse } from 'next/server';
import { getPostsIndex } from '@/lib/content/posts';
import { getUpdateRecords } from '@/lib/content/updateRecord';
import type { SearchEntry } from '@/lib/content';
import { navItems } from '@/lib/site';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

/**
 * 页面路由描述（nav.json 只放导航元数据，描述不适合塞那里）
 * 集中在此维护，便于按需增减
 */
const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/': '回到首页 — 个人数字空间入口',
  '/music': '收听阿鲲收藏的音乐曲目',
  '/articles': '阅读所有技术、生活、杂谈类文章',
  '/games': '2048、贪吃蛇等 H5 小游戏',
  '/update-record': '查看博客的版本迭代与变更记录',
  '/about': '关于阿鲲 — 个人简介与联系方式',
};

export const dynamic = 'force-static';

/**
 * 从 MDX/Markdown 正文提取纯文本摘要（前 maxLen 字符）
 *
 * 实现思路：基于 mdast AST 遍历，只收集 `text` 节点 value。
 * - code 节点（代码块）→ 跳过，避免源码污染描述
 * - inlineCode 节点 → 跳过，行内代码不进摘要
 * - html 节点（MDX JSX 也会被 remark-parse 当作 html）→ 子节点的 text 仍会被收集
 * - heading/list/table/blockquote 等容器 → 递归遍历子节点收集 text
 *
 * 对比 regex 清洗的鲁棒性：
 * - 代码块里的 `**xxx**` 不会被误删
 * - 表格的 `|---|---|` 不会出现
 * - HTML 标签 `<Custom>文本</Custom>` 只留 "文本"
 * - 嵌套列表 / 引用 / 链接都能正确处理
 *
 * 依赖说明：unified/remark-parse 由 next-mdx-remote 传递引入（已在 node_modules），
 * remark-gfm 为直接依赖。三者均为项目内已有包，零新增依赖。
 */
function extractPlainText(md: string, maxLen = 120): string {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md);

  let text = '';
  type MdNode = { type?: string; value?: unknown; children?: unknown[] };
  const walk = (node: MdNode) => {
    // 只收集 text 节点：天然排除所有 markdown 语法噪音
    if (node.type === 'text' && typeof node.value === 'string') {
      text += node.value;
    }
    if (Array.isArray(node.children)) {
      // children 声明为 unknown[]，forEach 回调参数推导为 unknown，
      // 无法直接喂给 walk（期望具体对象类型）——这里局部 cast 受控范围
      (node.children as MdNode[]).forEach(walk);
    }
  };
  walk(tree);

  // 合并空白 + 截断
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

export async function GET() {
  // 1) 文章（content/posts）
  const posts = getPostsIndex();
  const articleEntries: SearchEntry[] = posts.map((post) => ({
    id: `article:${post.slug}`,
    type: 'article',
    title: post.title,
    description: post.summary || '',
    href: `/articles/${post.slug}`,
    tags: post.tags || [],
    category: post.type ?? '',
  }));

  // 2) 更新记录（content/update-record）— 用 AST 提取正文摘要
  const records = getUpdateRecords();
  const updateEntries: SearchEntry[] = records.map((rec) => ({
    id: `update:${rec.slug}`,
    type: 'update',
    title: rec.title,
    description: extractPlainText(rec.bodyRaw, 120),
    href: `/update-record#${rec.slug}`,
    tags: [],
    category: rec.version || rec.category || 'update',
  }));

  // 3) 页面路由（navItems）
  const pageEntries: SearchEntry[] = navItems.map((item) => ({
    id: `page:${item.href}`,
    type: 'page',
    title: item.label,
    description: PAGE_DESCRIPTIONS[item.href] || '',
    href: item.href,
    tags: [],
    category: 'page',
  }));

  const searchIndex = [...articleEntries, ...updateEntries, ...pageEntries];

  return NextResponse.json(searchIndex, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}