import { getPostsIndex } from "../lib/content/posts";
import { socials } from "../lib/site";
import PostCard from "./components/PostCard";
import Pagination from "./components/Pagination";
import { Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import Link from "next/link";

// 每页文章数
const PAGE_SIZE = 10;

/** 游客可见文章数上限（与 /articles 一致：未登录仅可看最新 3 篇，接受 SEO 损失） */
const GUEST_ARTICLE_LIMIT = 3;

// 「关注我」卡片：数据来自 data/site/socials.json；各平台差异化配色属呈现层，按 key 映射
const SOCIAL_CARD_STYLES: Record<
  string,
  { card: string; iconBox: string; labelHover: string }
> = {
  bilibili: {
    card: "hover:border-accent/50 hover:bg-accent/5",
    iconBox: "bg-accent/15 text-accent",
    labelHover: "group-hover:text-accent",
  },
  github: {
    card: "hover:border-gray-400/50 hover:bg-gray-500/5",
    iconBox: "bg-gray-500/15 text-gray-700 dark:text-gray-200",
    labelHover: "group-hover:text-gray-700 dark:group-hover:text-gray-200",
  },
  qq: {
    card: "hover:border-sky-400/50 hover:bg-sky-500/5",
    iconBox: "bg-sky-500/15 text-sky-500",
    labelHover: "",
  },
};

// 首页只展示这三个平台（blog 即本站，不自链）
const HOME_SOCIALS = socials.filter((s) => s.key in SOCIAL_CARD_STYLES);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;

  const user = await getCurrentUser(); // cookies() 介入 → 本页按请求动态渲染（区分登录态）

  const allPosts = getPostsIndex(); // 只读元数据索引，不含正文

  // 内容分层：首页主信息流只展示「个人创作」（技术/折腾/随笔）；
  // 资讯存档(news) 已迁至 /articles 专栏页面，首页不再展示。
  // 显式按发布时间倒序（最新在前），保证首页信息流顺序与登录态无关。
  const featuredPosts = allPosts
    .filter((p) => p.type !== "news")
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

  // 游客限制：未登录仅展示最新 3 篇（按发布时间倒序取前 3；与 /articles 一致；接受 SEO 损失）
  const visibleFeatured = user ? featuredPosts : featuredPosts.slice(0, GUEST_ARTICLE_LIMIT);
  const lockedCount = featuredPosts.length - visibleFeatured.length;

  // 分页（仅基于 visibleFeatured）
  const totalPages = Math.max(1, Math.ceil(visibleFeatured.length / PAGE_SIZE));
  const requestedPage = parseInt(page ?? "1", 10);
  const currentPage = Math.min(
    Math.max(1, isNaN(requestedPage) ? 1 : requestedPage),
    totalPages
  );
  const start = (currentPage - 1) * PAGE_SIZE;
  const posts = visibleFeatured.slice(start, start + PAGE_SIZE);

  // 首页 Lobby 轮播（channels）已上移到 layout 的 GlobalHero，
  // 此处仅渲染内容面板，负 margin 上浮骑在 Hero 底部。

  return (
    <div>
      {/* 下方内容：GlobalHero 已在 layout 中挂载（首页为 Lobby 轮播）；
          玻璃面板负 margin 上浮，骑在 Hero 底部 */}
      <div className="relative z-20 max-w-[1400px] mx-auto px-6 -mt-20 md:-mt-28 pb-12">
        {/* 玻璃面板：外层 1px 霓虹渐变描边，内层毛玻璃 */}
        <div className="glass-glow rounded-3xl p-[1px]">
          <div className="glass-panel glass-shine rounded-[23px] p-6 pt-8 md:pt-10">
            {/* 两栏布局（移动端优化后）：
                - 移动端：堆叠为 文章流(order-1) → 关注我(order-2)，核心内容最先可见
                - 桌面端 md+：左 文章流 + 右 关注我（sticky 底部），移除原左栏（兴趣+明细统计已迁出） */}
            <div className="flex flex-col md:flex-row md:items-start md:gap-8">
              {/* 中：最近创作（视觉重心，滚动主体） */}
              <main className="order-1 md:order-1 flex-1 min-w-0 space-y-10">
                <div className="flex items-baseline justify-between pb-3 border-b border-[var(--card-border-inset)]">
                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)]">📝 文章</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">空间里的一些书写——技术、折腾与生活随笔。</p>
                  </div>
                  <Link href="/articles" className="text-sm font-medium text-accent hover:underline shrink-0 ml-4">查看全部 →</Link>
                </div>
                {posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
                <Pagination currentPage={currentPage} totalPages={totalPages} />

                {/* 游客锁定卡：列表仅展示最新 3 篇，其余引导登录 */}
                {!user && lockedCount > 0 && (
                  <div className="mt-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center">
                    <Lock className="mx-auto h-6 w-6 text-[var(--text-muted)]" />
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">
                      还有 {lockedCount} 篇文章需要登录后查看
                    </p>
                    <Link
                      href="/login?next=%2F"
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
                    >
                      登录 / 注册
                    </Link>
                  </div>
                )}
              </main>

              {/* 右：关注我（移动端堆在文章后，桌面端右栏 sticky 底部） */}
              <aside className="order-2 md:order-2 md:w-[260px] lg:w-[320px] md:shrink-0 md:self-end md:sticky md:bottom-24">
                <div className="glass-card p-5">
                  <h2 className="text-base font-semibold mb-3 text-[var(--text-secondary)] flex items-center gap-2">
                    <span>💖</span> 关注我
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mb-3">你可以在这里找到我：</p>
                  <div className="space-y-2">
                    {HOME_SOCIALS.map((s) => {
                      const style = SOCIAL_CARD_STYLES[s.key];
                      const inner = (
                        <>
                          <span className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-lg text-base ${style.iconBox}`}>
                            {s.emoji}
                          </span>
                          <span className="flex flex-col min-w-0">
                            <span className={`text-sm font-medium text-[var(--text-secondary)] transition-colors ${style.labelHover}`}>
                              {s.label}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] truncate">{s.handle}</span>
                            {s.desc && (
                              <span className="text-xs text-[var(--text-muted)]/80 mt-0.5 leading-snug">{s.desc}</span>
                            )}
                          </span>
                          {s.href && (
                            <span className="ml-auto text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform">↗</span>
                          )}
                        </>
                      );
                      const cardClass = `group flex items-center gap-3 p-2.5 rounded-xl border border-[var(--card-border-inset)] transition-all duration-200 ${style.card}`;
                      return s.href ? (
                        <a
                          key={s.key}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={s.title}
                          className={cardClass}
                        >
                          {inner}
                        </a>
                      ) : (
                        <div key={s.key} title={s.title} className={cardClass}>
                          {inner}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}