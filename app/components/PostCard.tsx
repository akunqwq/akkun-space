/**
 * PostCard.tsx - 文章摘要卡片
 * ================================================
 *
 * 首页/列表页使用的轻量卡片，只展示元数据：
 * 封面、标题、日期、作者、阅读时间、摘要、标签。
 * 不渲染正文，点击进入文章详情页。
 */

import Link from "next/link";
import Image from "next/image";
import { formatDate } from "../../lib/formatDate";
import { POST_TYPE_LABELS, type PostIndexItem, type PostType } from "../../lib/posts";

// 各类型对应的徽章配色（暗/亮主题通用）
const TYPE_BADGE_STYLES: Record<PostType, string> = {
  tech: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  tinker: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
  essay: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  news: "bg-gray-500/15 text-gray-600 dark:text-gray-300",
};

export default function PostCard({ post }: { post: PostIndexItem }) {
  const type = post.type ?? "essay";
  return (
    <Link
      href={`/articles/${post.slug}`}
      className="
        group block overflow-hidden
        rounded-2xl bg-[var(--card-bg)] backdrop-blur-md
        border border-[var(--border-color)] shadow-sm
        hover:shadow-xl hover:-translate-y-1
        transition-all duration-300
      "
    >
      {/* 封面 */}
      {post.cover && (
        <div className="relative h-36 w-full overflow-hidden bg-[var(--border-color)]">
          <Image
            src={post.cover}
            alt={post.title}
            fill
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        {/* 类型徽章 */}
        <div className="mb-3">
          <span
            className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${TYPE_BADGE_STYLES[type]}`}
          >
            {POST_TYPE_LABELS[type]}
          </span>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold leading-snug text-[var(--text-primary)] group-hover:text-violet-500 transition-colors mb-3">
          {post.title}
        </h2>

        {/* 元信息：日期 / 作者 / 阅读时间 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)] mb-3">
          <time dateTime={post.date} className="text-[var(--link-color)]">{formatDate(post.date)}</time>
          {post.author && <span>{post.author}</span>}
          <span>{post.readingTime >= 60 ? '约 60+ 分钟阅读' : `约 ${post.readingTime} 分钟阅读`}</span>
        </div>

        {/* 摘要 */}
        {post.summary && post.summary !== "-" && (
          <p className="text-[var(--text-secondary)] leading-relaxed line-clamp-3 mb-4">
            {post.summary}
          </p>
        )}

        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-[var(--tag-bg)] text-[var(--tag-text)] text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
