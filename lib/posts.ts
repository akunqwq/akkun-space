import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { calcReadingTime } from './reading-time';

const postsDir = path.join(process.cwd(), "content/posts");
const indexFile = path.join(process.cwd(), "data/posts.json");

/**
 * 读取构建时生成的文章索引（data/posts.json）。
 * 若索引文件不存在（例如首次运行 / 开发时未生成），
 * 自动回退到实时读取文件系统，保证始终可用。
 */
export function getPostsIndex(): PostIndexItem[] {
  try {
    if (fs.existsSync(indexFile)) {
      const raw = fs.readFileSync(indexFile, "utf-8");
      const data = JSON.parse(raw);
      // 兼容新旧格式：新格式带 posts 字段，旧格式直接是数组
      return (data.posts ?? data) as PostIndexItem[];
    }
  } catch (error) {
    console.error("读取文章索引失败，回退到文件系统:", error);
  }
  // 回退：实时从文件系统读取（返回结构兼容 PostIndexItem）
  return getAllPosts() as unknown as PostIndexItem[];
}

// 文章类型：用于内容分层（技术 / 折腾 / 随笔 / 资讯存档）
// tech=技术  tinker=折腾  essay=随笔  news=资讯存档（新闻搬运）
export type PostType = 'tech' | 'tinker' | 'essay' | 'news';

export const POST_TYPE_LABELS: Record<PostType, string> = {
  tech: '技术',
  tinker: '折腾',
  essay: '随笔',
  news: '资讯',
};

const VALID_TYPES: PostType[] = ['tech', 'tinker', 'essay', 'news'];

// 归一化 type：非法/缺失时默认归为 essay（个人随笔，避免被误隐藏）
export function normalizePostType(type: unknown): PostType {
  return VALID_TYPES.includes(type as PostType) ? (type as PostType) : 'essay';
}

// 文章元数据类型
export interface PostMeta {
  title: string;
  date: string;
  author?: string;
  cover?: string;
  summary?: string;
  tags?: string[];
  order?: number;
  type?: PostType;
  slug?: string;   // 自定义 URL
  [key: string]: any;
}

// 文章列表项类型
export interface PostListItem extends PostMeta {
  slug: string;
  summary: string;
  readingTime: number;
  fileCreatedTime: number;
}

// 文章索引项类型（来自 data/posts.json，不含正文）
export interface PostIndexItem {
  slug: string;
  title: string;
  date: string;
  author?: string | null;
  cover?: string;
  summary: string;
  tags?: string[];
  type: PostType;
  order?: number | null;
  readingTime: number;
  fileCreatedTime: number;
}

// 文章详情类型
export interface Post extends PostMeta {
  slug: string;
  url: string;
  readingTime: number;
  body: {
    raw: string;
  };
  bodyRaw: string;
}

// 模块级缓存：仅生产环境缓存（构建期/运行时复用）；dev 每次重算保证编辑 MDX 后列表即时刷新
let _allPostsCache: PostListItem[] | null = null;

// 获取所有文章（按日期降序排列）
export function getAllPosts(): PostListItem[] {
  if (_allPostsCache && process.env.NODE_ENV === "production") return _allPostsCache;
  try {
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

    _allPostsCache = result;
    return result;
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
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

    // 阅读时间优先取构建阶段生成的索引值，避免每次渲染重算；缺失时回退计算
    const idxItem = getPostsIndex().find(
      (p) => p.slug === finalSlug || p.slug === decodedSlug
    );
    const readingTime = idxItem?.readingTime ?? calcReadingTime(content);

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
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

// 文章索引的元信息（来自 data/posts.json 的 meta 字段）
export interface PostsIndexMeta {
  hash: string;
  generatedAt: string;
  version: number;
}

// 文章分类统计（来自 data/posts.json 的 stats 字段）
export interface PostsIndexStats {
  total: number;
  tech: number;
  tinker: number;
  essay: number;
  news: number;
}

/**
 * 读取文章索引的元信息与分类统计。
 * 供首页展示「技术文章 X 篇」等统计，以及增量构建比对 hash。
 * 若索引文件不存在或旧格式（无 meta/stats），返回 null。
 */
export function getPostsMeta(): { meta: PostsIndexMeta; stats: PostsIndexStats } | null {
  try {
    if (fs.existsSync(indexFile)) {
      const raw = fs.readFileSync(indexFile, "utf-8");
      const data = JSON.parse(raw);
      if (data.meta && data.stats) {
        return { meta: data.meta, stats: data.stats };
      }
    }
  } catch (error) {
    console.error("读取文章索引元信息失败:", error);
  }
  return null;
}