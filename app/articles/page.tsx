import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, type PostListItem } from "../../lib/posts";

export const metadata: Metadata = {
  title: "阿鲲 の小窝 - 专栏",
  description: "阿鲲的专栏",
};

export default function ArticlesPage() {
  const articles = getAllPosts();

  return (
    <main className="max-w-5xl mx-auto px-6 pt-24 md:pt-12 pb-12">
      <h1 className="text-4xl font-bold mb-10 tracking-tight text-[var(--text-primary)]">
        专栏列表
      </h1>

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
            <div className="h-40 w-full overflow-hidden bg-[var(--border-color)]">
              {a.cover ? (
                <img
                  src={a.cover}
                  alt={a.title}
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
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="text-xl font-semibold leading-snug text-[var(--text-primary)] group-hover:text-pink-500 transition-colors">
                  {a.title}
                </h2>
                <span className="text-xs text-[var(--text-muted)] shrink-0 bg-[var(--border-color)] px-2 py-1 rounded-full">
                  {new Date(a.date).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <p className="text-[var(--text-secondary)] text-sm line-clamp-3 leading-relaxed">
                {a.summary || "-"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
