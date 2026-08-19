import { getPostsIndex, getPostsMeta, type PostsIndexStats } from "../lib/posts";
import { socials } from "../lib/socials";
import PostCard from "./components/PostCard";
import Pagination from "./components/Pagination";

// 每页文章数
const PAGE_SIZE = 10;

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

  const allPosts = getPostsIndex(); // 只读元数据索引，不含正文

  // 分类统计：优先用构建时生成的 meta，旧格式则实时从索引计算
  const meta = getPostsMeta();
  const stats: PostsIndexStats =
    meta?.stats ?? (() => {
      const s: PostsIndexStats = { total: allPosts.length, tech: 0, tinker: 0, essay: 0, news: 0 };
      for (const p of allPosts) s[p.type] += 1;
      return s;
    })();

  // 内容分层：首页主信息流只展示「个人创作」（技术/折腾/随笔），
  // 资讯存档(news) 单独放在底部低权重区，不抢占首页第一印象。
  const featuredPosts = allPosts.filter((p) => p.type !== "news");
  const newsPosts = allPosts
    .filter((p) => p.type === "news")
    .sort((a, b) => b.date.localeCompare(a.date));

  // 分页（仅基于 featuredPosts）
  const totalPages = Math.max(1, Math.ceil(featuredPosts.length / PAGE_SIZE));
  const requestedPage = parseInt(page ?? "1", 10);
  const currentPage = Math.min(
    Math.max(1, isNaN(requestedPage) ? 1 : requestedPage),
    totalPages
  );
  const start = (currentPage - 1) * PAGE_SIZE;
  const posts = featuredPosts.slice(start, start + PAGE_SIZE);

  // 首页 Lobby 轮播（channels）已上移到 layout 的 GlobalHero，
  // 此处仅渲染内容面板，负 margin 上浮骑在 Hero 底部。

  return (
    <div>
      {/* 下方内容：GlobalHero 已在 layout 中挂载（首页为 Lobby 轮播）；
          玻璃面板负 margin 上浮，骑在 Hero 底部 */}
      <div className="relative z-20 max-w-[1400px] mx-auto px-6 -mt-20 md:-mt-28 pb-12">
        {/* 三栏玻璃面板：外层 1px 霓虹渐变描边，内层毛玻璃 */}
        <div className="glass-glow rounded-3xl p-[1px]">
          <div className="glass-panel glass-shine rounded-[23px] p-6 pt-8 md:pt-10">
          {/* 三栏：左信息(停靠底部) | 中(滚动主体) | 右信息(停靠底部) */}
          <div className="flex flex-col md:flex-row md:items-start md:gap-8">
            {/* 左：我的兴趣 / 统计（md+ 停靠中心左下方，随中心滚动常驻两侧底部） */}
            <aside className="order-1 md:order-1 md:w-[260px] lg:w-[320px] md:shrink-0 md:self-end md:sticky md:bottom-24">
              <div className="glass-card p-5">
                <h2 className="text-base font-semibold mb-3 text-[var(--text-secondary)]">🌸 我的兴趣</h2>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  ACG / 纯音乐 / MMD / 原神 / 敲代码
                  <br />才...才不是猫娘喵。
                </p>
                <div className="mt-5 pt-4 border-t border-[var(--card-border-inset)]">
                  <h3 className="text-xs font-medium mb-2 text-[var(--text-muted)]">📊 站点统计</h3>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1">
                    <li>技术文章 {stats.tech} 篇</li>
                    <li>折腾记录 {stats.tinker} 篇</li>
                    <li>随笔 {stats.essay} 篇</li>
                    <li>资讯存档 {stats.news} 篇</li>
                    <li className="pt-1 font-medium text-[var(--text-secondary)]">总计 {stats.total} 篇</li>
                  </ul>
                </div>
              </div>
            </aside>

            {/* 中：最近创作（视觉重心，滚动主体） */}
            <main className="order-3 md:order-2 flex-1 min-w-0 space-y-10">
              <div className="flex items-baseline justify-between pb-3 border-b border-[var(--card-border-inset)]">
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">📝 文章</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">空间里的一些书写——技术、折腾与生活随笔。</p>
                </div>
                <a href="/articles" className="text-sm font-medium text-accent hover:underline shrink-0 ml-4">查看全部 →</a>
              </div>
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </main>

            {/* 右：关注我（md+ 停靠中心右下方，随中心滚动常驻两侧底部） */}
            <aside className="order-2 md:order-3 md:w-[260px] lg:w-[320px] md:shrink-0 md:self-end md:sticky md:bottom-24">
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

        {/* 资讯存档：低权重区，面板下方 */}
        {newsPosts.length > 0 && (
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
                  {newsPosts.slice(0, 8).map((post) => (
                    <li key={post.slug}>
                      <a
                        href={`/articles/${encodeURIComponent(post.slug)}`}
                        className="text-[var(--text-secondary)] hover:text-accent transition-colors"
                      >
                        · {post.title}
                      </a>
                    </li>
                  ))}
                  <li className="pt-1">
                    <a href="/articles?type=news" className="text-accent hover:underline text-xs">
                      查看全部资讯存档 →
                    </a>
                  </li>
                </ul>
              </details>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
