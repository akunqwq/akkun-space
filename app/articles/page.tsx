import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, type PostListItem } from "../../lib/posts";

export const metadata: Metadata = {
  title: "阿鲲 の小窝 - 文章",
  description: "阿鲲的文章列表",
};

export default function ArticlesPage() {
  const articles = getAllPosts();

  return (
    <main className="max-w-5xl mx-auto px-6 pt-24 md:pt-12 pb-12">
      <h1 className="text-4xl font-bold mb-10 tracking-tight text-[var(--text-primary)]">
        文章列表
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

            {/* 下方内容区：小图 + 文字 */}
            <div className="p-6 flex items-start gap-4">

              {/* 小缩略图（左侧） */}
              <div
                className="
      w-20 h-20 rounded-xl overflow-hidden bg-[var(--border-color)]
      shrink-0
      md:w-24 md:h-24
    "
              >
                {a.thumbnail ? (
                  <img
                    src={a.thumbnail}
                    alt={a.title}
                    className="w-full h-full object-cover"
                  />
                ) : a.cover ? (
                  <img
                    src={a.cover}
                    alt={a.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--text-muted)]" />
                )}
              </div>

              {/* 右侧文字区域 */}
              <div className="flex-1 pt-1">
                <div className="text-sm text-[var(--text-muted)]">{a.date}</div>

                <h2 className="text-xl font-semibold mt-1 leading-snug text-[var(--text-primary)]">
                  {a.title}
                </h2>

                <p className="text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed">
                  {a.summary}
                </p>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
