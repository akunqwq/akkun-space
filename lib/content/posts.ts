// 强约束：本模块含 fs / path 等 Node.js 专有操作，仅服务端可用。
// 任何客户端组件若误 import 本模块（含绕过聚合入口直接走 @/lib/content/posts），
// 构建期会立即报错给出清晰提示，而非运行时模糊的 "Can't resolve 'fs'"。
// 客户端需要的纯类型 / 常量 / 纯函数请走聚合入口 @/lib/content。
import 'server-only';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { calcReadingTime } from './reading-time';
// 纯类型从 types.ts 拉取，re-export 保持旧 import 路径 @/lib/content/posts 兼容
import type {
  PostMeta,
  PostListItem,
  PostIndexItem,
} from './types';
// re-export 让从 @/lib/content/posts 拿类型的调用方仍可用
export type {
  PostMeta,
  PostListItem,
  PostIndexItem,
  PostsIndexMeta,
  PostsIndexStats,
} from './types';
import { normalizePostType } from './postTypes';
// postTypes 内容也经聚合入口暴露，此处不再 re-export 避免重复

const postsDir = path.join(process.cwd(), "content/posts");
const indexFile = path.join(process.cwd(), "data/posts.json");

/**
 * 读取构建时生成的文章索引（data/posts.json）。
 * 开发期未生成索引时，回退到实时读取文件系统，保证首页/sitemap 始终可用。
 */
export function getPostsIndex(): PostIndexItem[] {
  if (!fs.existsSync(indexFile)) {
    return getAllPosts() as unknown as PostIndexItem[];
  }
  const raw = fs.readFileSync(indexFile, "utf-8");
  const data = JSON.parse(raw);
  // 兼容新旧格式：新格式带 posts 字段，旧格式直接是数组
  return (data.posts ?? data) as PostIndexItem[];
}

// 文章详情类型（服务端专用，含 body.raw 正文，客户端无需直接持有）
export interface Post extends PostMeta {
  slug: string;
  url: string;
  readingTime: number;
  body: {
    raw: string;
  };
  bodyRaw: string;
}

// 获取所有文章（按日期降序排列）
export function getAllPosts(): PostListItem[] {
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const files = fs.readdirSync(postsDir);
    const mdxFiles = files.filter(file => /\.mdx?$/.test(file));

    const result = mdxFiles
      .map((file) => {
        const slug = file.replace(/\.mdx?$/, "");
        const filePath = path.join(postsDir, file);
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data: meta, content } = matter(raw);

        // 获取文件创建时间
        const stats = fs.statSync(filePath);
        const fileCreatedTime = stats.birthtime.getTime();

        // 阅读时间（构建阶段已在 data/posts.json 算好；此处仅作回退）
        const readingTime = calcReadingTime(content);

        return {
          slug,
          ...meta,
          // 归一化 date：gray-matter 会把 YAML 日期解析成 Date 对象，
          // 但 PostMeta.date 声明为 string（与 posts.json 索引一致），此处强制归一。
          date:
            meta.date instanceof Date
              ? meta.date.toISOString().slice(0, 10)
              : typeof meta.date === "string"
                ? meta.date
                : "",
          type: normalizePostType(meta.type),
          summary: meta.summary ?? "-",
          readingTime,
          fileCreatedTime,
        } as unknown as PostListItem;
      })
      .filter((post) => {
        // 必须有 order，否则不展示
        return typeof post.order === 'number' && !isNaN(post.order);
      })
      .sort((a, b) => {
        // 1. 按发表日期降序（最新文章在前）
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        // 2. 同一天按 order 降序作为次级排序
        return (b.order ?? 0) - (a.order ?? 0);
      });

    return result;
}

// 根据 slug 获取单篇文章
export function getPostBySlug(slug: string): Post | null {
  try {
    if (!slug || typeof slug !== 'string') {
      return null;
    }

    // URL 解码（处理中文文件名）
    const decodedSlug = decodeURIComponent(slug);

    // 直接匹配文件名（支持 .mdx 和 .md 两种扩展名）
    let filePath = path.join(postsDir, decodedSlug + ".mdx");

    if (!fs.existsSync(filePath)) {
      filePath = path.join(postsDir, decodedSlug + ".md");
    }

    if (!fs.existsSync(filePath)) {
      // 如果直接文件名不存在，遍历所有文件查找匹配的自定义 slug
      const files = fs.readdirSync(postsDir);
      const mdxFiles = files.filter(file => /\.mdx?$/.test(file));

      for (const file of mdxFiles) {
        const tempPath = path.join(postsDir, file);
        const raw = fs.readFileSync(tempPath, "utf-8");
        const { data: meta } = matter(raw);

        // 检查 meta.slug 是否匹配请求的 slug（支持编码后的URL）
        if (meta.slug === decodedSlug || meta.slug === slug) {
          filePath = tempPath;
          break;
        }
      }

      // 如果没找到匹配的文件
      if (!fs.existsSync(filePath)) {
        return null;
      }
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const { data: meta, content } = matter(raw);

    // 使用自定义 slug 或文件名
    const finalSlug = meta.slug || decodedSlug;

    // 阅读时间直接由正文计算（与构建期索引使用同一函数，无需再解析整份索引）
    const readingTime = calcReadingTime(content);

    return {
      slug: finalSlug,
      url: `/articles/${finalSlug}`,
      ...meta,
      body: {
        raw: content,
      },
      bodyRaw: content,
      readingTime,
    } as Post;
  } catch {
    return null;
  }
}

/*
 * 获取文章索引元信息（仅构建期使用）
 * 注意：实际返回 shape 为 { meta, stats }，由 TS 推导，不显式约束以保持与历史调用方契约。
 */
export function getPostsMeta() {
  if (!fs.existsSync(indexFile)) {
    return null;
  }

  const raw = fs.readFileSync(indexFile, "utf-8");
  const data = JSON.parse(raw);

  if (!data.meta || !data.stats) {
    return null;
  }

  return {
    meta: data.meta,
    stats: data.stats,
  };
}
