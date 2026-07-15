import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts, POST_TYPE_LABELS, normalizePostType, type PostListItem, type PostType } from "../../lib/posts";
import { formatDate } from "../../lib/formatDate";

export const metadata: Metadata = {
  title: "文章",
  description: "阿鲲的文章",
};

// 筛选标签：全部 + 各类型
const FILTERS: { key: "all" | PostType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "tech", label: POST_TYPE_LABELS.tech },
  { key: "tinker", label: POST_TYPE_LABELS.tinker },
  { key: "essay", label: POST_TYPE_LABELS.essay },
  { key: "news", label: POST_TYPE_LABELS.news },
];

const TYPE_BADGE_STYLES: Record<PostType, string> = {
  tech: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  tinker: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
  essay: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  news: "bg-gray-500/15 text-gray-600 dark:text-gray-300",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: rawType } = await searchParams;
  const activeType = rawType && rawType !== "all" ? normalizePostType(rawType) : null;

  const all = getAllPosts();
  const articles = activeType ? all.filter((a) => a.type === activeType) : all;

  return (
    <main className="max-w-5xl mx-auto px-6 pt-24 md:pt-12 pb-12">
      <h1 className="text-4xl font-bold mb-6 tracking-tight text-[var(--text-primary)]">
        文章列表
      </h1>

      {/* 类型筛选标签栏 */}
      <div className="flex flex-wrap gap-2 mb-10">
        {FILTERS.map((f) => {
          const isActive = (f.key === "all" && !activeType) || f.key === activeType;
          const count =
            f.key === "all"
              ? all.length
              : all.filter((a) => a.type === f.key).length;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/articles" : `/articles?type=${f.key}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                isActive
                  ? "bg-violet-500 text-white border-violet-500"
                  : "bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-violet-500"
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {articles.map((a: PostListItem) => (
          <Link
            key={a.slug}
            href={`/articles/${a.slug}`}
            className="
        group block overflow-hidden
        rounded-2xl bg-[var(--card-bg)] backdrop-blur-md
        border border-[var(--border-color)] shadow-sm
        hover:shadow-xl hover:-translate-y-1
        transition-all duration-300
      "
          >
            {/* 顶部封面 */}
            <div className="relative h-40 w-full overflow-hidden bg-[var(--border-color)]">
              {a.cover ? (
                <Image
                  src={a.cover}
                  alt={a.title}
                  fill
                  className="
              w-full h-full object-cover
              group-hover:scale-105
              transition-transform duration-300
            "
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-[var(--border-color)] to-[var(--text-muted)]" />
              )}
            </div>

            {/* 下方内容区：文字 */}
            <div className="p-6">
              {/* 类型徽章 */}
              <div className="mb-2">
                <span
                  className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${TYPE_BADGE_STYLES[a.type ?? "essay"]}`}
                >
                  {POST_TYPE_LABELS[a.type ?? "essay"]}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="text-xl font-semibold leading-snug text-[var(--text-primary)] group-hover:text-violet-500 transition-colors">
                  {a.title}
                </h2>
                <span className="text-xs text-[var(--text-muted)] shrink-0 bg-[var(--border-color)] px-2 py-1 rounded-full">
                  {formatDate(a.date)}
                </span>
              </div>

              <p className="text-[var(--text-secondary)] text-sm line-clamp-3 leading-relaxed">
                {a.summary || "-"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <p className="text-[var(--text-secondary)] mt-8">该分类下暂无文章。</p>
      )}
    </main>
  );
}
