import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getAllPosts } from "../../lib/content/posts";
import { getCurrentUser } from "@/lib/auth/session";
import GlassPage from "../components/GlassPage";
import { ArticleSearchBar } from "../components/ArticleSearchBar";

export const metadata: Metadata = {
  title: "专栏",
  description: "专栏 - 阿鲲の小窝",
};

/** 游客可见文章数上限（阿鲲 2026-09-09 决策：未登录仅可看最新 3 篇，接受 SEO 损失） */
const GUEST_ARTICLE_LIMIT = 3;

export default async function ArticlesPage() {
  // cookies() 介入 → 本页按请求动态渲染（静态化无法区分登录态）
  const user = await getCurrentUser();
  const articles = getAllPosts();

  // 内容分层：主信息流只展示「个人创作」（技术/折腾/随笔），
  // 资讯存档(news) 单独成区，登录后可见。
  const creationPosts = articles.filter((p) => p.type !== "news");
  const newsPosts = articles
    .filter((p) => p.type === "news")
    .sort((a, b) => b.date.localeCompare(a.date));

  // 游客限制：未登录仅展示最新 3 篇「个人创作」
  const visible = user ? creationPosts : creationPosts.slice(0, GUEST_ARTICLE_LIMIT);
  const lockedCount = creationPosts.length - visible.length;

  return (
    <GlassPage maxWidth="max-w-[1400px]">
      <ArticleSearchBar articles={visible} totalArticles={creationPosts} />

      {/* 游客锁定卡：列表仅展示最新 3 篇，其余引导登录 */}
      {!user && lockedCount > 0 && (
        <div className="mt-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center">
          <Lock className="mx-auto h-6 w-6 text-[var(--text-muted)]" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            还有 {lockedCount} 篇文章需要登录后查看
          </p>
          <Link
            href="/login?next=%2Farticles"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
          >
            登录 / 注册
          </Link>
        </div>
      )}

      {/* 资讯存档：登录后可见（与首页原低权重区同源，迁至此页） */}
      {user && newsPosts.length > 0 && (
        <section className="mt-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <details className="group bg-[var(--card-bg)] backdrop-blur-lg rounded-2xl border border-[var(--card-border)] p-5">
              <summary className="cursor-pointer list-none flex items-center justify-between text-[var(--text-secondary)]">
                <span className="font-medium">
                  📂 资讯存档（{newsPosts.length} 篇新闻记录）
                </span>
                <span className="text-xs group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <ul className="mt-4 space-y-2 text-sm">
                {newsPosts.map((post) => (
                  <li key={post.slug}>
                    <a
                      href={`/articles/${encodeURIComponent(post.slug)}`}
                      className="text-[var(--text-secondary)] hover:text-accent transition-colors"
                    >
                      · {post.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>
      )}
    </GlassPage>
  );
}
