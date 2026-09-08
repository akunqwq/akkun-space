/**
 * 内容域共享纯类型集中模块
 *
 * 职责：把客户端组件可能需要用到的纯类型从 posts.ts / updateRecord.ts 集中提取到此处，
 *   让聚合入口 `lib/content/index.ts` re-export 时只拉纯类型，不牵连 fs / path 等
 *   Node.js 专有模块（posts.ts / updateRecord.ts 含 fs 操作，仅服务端可用）。
 *
 * 架构边界：
 *   - 客户端组件 -> @/lib/content 聚合入口 -> 本文件（纯类型，零运行时依赖）
 *   - 服务端路由 -> @/lib/content/posts / @/lib/content/updateRecord 子模块（含 fs，服务端运行）
 *
 * 注意：Post 类型（含 body.raw 正文）保留在 posts.ts，因为它服务端专用、客户端无需直接持有。
 */

import type { PostType } from './postTypes';

// ==================== 文章相关类型 ====================

/** 文章元数据（来自 frontmatter，纯类型） */
export interface PostMeta {
  title: string;
  date: string;
  author?: string;
  cover?: string;
  summary?: string;
  tags?: string[];
  order?: number;
  type?: PostType;
  slug?: string; // 自定义 URL
  [key: string]: unknown;
}

/** 文章列表项（含派生字段 readingTime / fileCreatedTime） */
export interface PostListItem extends PostMeta {
  slug: string;
  summary: string;
  readingTime: number;
  fileCreatedTime: number;
}

/** 文章索引项（来自 data/posts.json，不含正文） */
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

/** 文章索引元信息（来自 data/posts.json 的 meta 字段） */
export interface PostsIndexMeta {
  hash: string;
  generatedAt: string;
  version: number;
}

/** 文章分类统计（来自 data/posts.json 的 stats 字段） */
export interface PostsIndexStats {
  total: number;
  tech: number;
  tinker: number;
  essay: number;
  news: number;
}

// ==================== 更新记录相关类型 ====================

/** 更新记录元数据（来自 frontmatter） */
export interface UpdateRecordMeta {
  title: string;
  date: string;
  emoji?: string;
  category?: string;
  version?: string;
  [key: string]: unknown;
}

/** 更新记录完整类型（含正文 raw 字符串） */
export interface UpdateRecord extends UpdateRecordMeta {
  slug: string;
  bodyRaw: string;
}
