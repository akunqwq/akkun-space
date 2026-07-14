/**
 * generate-posts-index.ts - 构建时文章索引生成脚本
 * ================================================
 *
 * 读取 content/posts 下所有 .md / .mdx 文件，
 * 只提取「列表页需要的元数据」（不含正文），生成 data/posts.json。
 *
 * 首页/列表页直接读这个 JSON，无需在渲染时读取并编译所有文章正文，
 * 大幅减少首屏体积与构建时间。
 *
 * 用法：
 *   npx tsx scripts/generate-posts-index.ts
 *   （已接入 npm run build，会在 next build 之前自动执行）
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { calcReadingTime } from '../lib/reading-time';

const postsDir = path.join(process.cwd(), 'content/posts');
const outputFile = path.join(process.cwd(), 'data/posts.json');

// 合法的文章类型
const VALID_TYPES = ['tech', 'tinker', 'essay', 'news'] as const;
type PostType = (typeof VALID_TYPES)[number];

function normalizePostType(type: unknown): PostType {
  return (VALID_TYPES as readonly string[]).includes(type as string)
    ? (type as PostType)
    : 'essay';
}

interface PostIndexItem {
  slug: string;
  title: string;
  date: string;
  author: string | null;
  cover: string;
  summary: string;
  tags: string[];
  type: PostType;
  order: number | null;
  readingTime: number;
  fileCreatedTime: number;
}

function normalizeDate(date: unknown): string {
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  if (typeof date === 'string') return date;
  return '';
}

function generateIndex() {
  if (!fs.existsSync(postsDir)) {
    console.error('❌ posts 目录不存在:', postsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(postsDir);
  const mdxFiles = files.filter((file) => /\.mdx?$/.test(file));

  const posts: PostIndexItem[] = mdxFiles
    .map((file) => {
      const slug = file.replace(/\.mdx?$/, '');
      const filePath = path.join(postsDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data: meta, content } = matter(raw);

      const stats = fs.statSync(filePath);
      const fileCreatedTime = stats.birthtime.getTime();

      // 阅读时间（构建阶段算好：剥离 Markdown 噪声后按 500 字/分钟估算）
      const readingTime = calcReadingTime(content);

      return {
        slug,
        title: meta.title ?? slug,
        date: normalizeDate(meta.date),
        author: meta.author ?? null,
        cover: meta.cover ?? '',
        summary: meta.summary ?? '-',
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        type: normalizePostType(meta.type),
        order: typeof meta.order === 'number' ? meta.order : null,
        readingTime,
        fileCreatedTime,
      };
    })

    .filter((post) => post.order !== undefined)
 
    .sort((a, b) => {
      if (a.order !== b.order) return (a.order ?? 9999) - (b.order ?? 9999);
      if (a.date !== b.date) return b.date.localeCompare(a.date); // 新增：order 相同则按发布时间降序
      return b.fileCreatedTime - a.fileCreatedTime;
    });

  // 确保 data 目录存在
  const dataDir = path.dirname(outputFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // C. 分类统计（按文章类型计数，并补齐可能为零的类型）
  const stats: Record<string, number> = { total: posts.length };
  for (const t of VALID_TYPES) stats[t] = 0;
  for (const p of posts) stats[p.type] = (stats[p.type] ?? 0) + 1;

  // B. 生成内容 hash（基于 posts 数组的确定性序列化）
  //    增量构建时可比对 hash 是否变化，无变化则跳过重建
  const hash =
    'sha256-' +
    crypto.createHash('sha256').update(JSON.stringify(posts)).digest('hex').slice(0, 16);

  const output = {
    meta: {
      hash,
      generatedAt: new Date().toISOString(),
      version: 2,
    },
    stats,
    posts,
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ 已生成文章索引: ${posts.length} 篇 → ${path.relative(process.cwd(), outputFile)}`);
  console.log(
    `   📊 统计: 共 ${stats.total} 篇 | ` +
      VALID_TYPES.map((t) => `${t}:${stats[t]}`).join('  ')
  );
  console.log(`   🔖 内容 hash: ${hash}`);
}

generateIndex();
