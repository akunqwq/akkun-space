import { getPostsIndex, getPostsMeta, type PostsIndexStats } from "../lib/posts";
import PostCard from "./components/PostCard";
import Pagination from "./components/Pagination";

// 每页文章数
const PAGE_SIZE = 10;

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
      <div className="relative z-20 max-w-7xl mx-auto px-4 -mt-24 md:-mt-32 pb-10">
        {/* 三栏玻璃面板：外层 1px 霓虹渐变描边，内层毛玻璃 */}
        <div className="glass-glow rounded-3xl p-[1px]">
          <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[23px] p-6 shadow-2xl border border-[var(--card-border)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* 左侧：兴趣 / 统计 */}
            <div className="md:col-span-3">
              <div className="md:sticky md:top-24">
                <div className="bg-[var(--card-bg-subtle)] backdrop-blur-md p-6 rounded-2xl border border-[var(--card-border)]">
                  <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">🌸 我的兴趣</h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    ACG / 纯音乐 / MMD / 原神 / 敲代码
                    <br />才...才不是猫娘喵。
                  </p>
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">📊 站点统计</h3>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1.5">
                      <li>技术文章 {stats.tech} 篇</li>
                      <li>折腾记录 {stats.tinker} 篇</li>
                      <li>随笔 {stats.essay} 篇</li>
                      <li>资讯存档 {stats.news} 篇</li>
                      <li className="pt-1 font-medium text-[var(--text-primary)]">总计 {stats.total} 篇</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 中间：最近创作 */}
            <div className="md:col-span-6 space-y-8">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">✍️ 最近创作</h2>
                <a href="/articles" className="text-sm text-accent hover:underline">查看全部 →</a>
              </div>
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>

            {/* 右侧：关注我 */}
            <div className="md:col-span-3">
              <div className="md:sticky md:top-24">
                <div className="bg-[var(--card-bg-subtle)] backdrop-blur-md p-6 rounded-2xl border border-[var(--card-border)]">
                  <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)] flex items-center gap-2">
                    <span>💖</span> 关注我
                  </h2>
                  <p className="text-[var(--text-secondary)] mb-4">你可以在这里找到我：</p>
                  <div className="space-y-3">
                    {/* Bilibili */}
                    <a
                      href="https://space.bilibili.com/286757068"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="点击跳转到我的bilibili主页~"
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-accent/50 hover:bg-accent/5 transition-all duration-200"
                    >
                      <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-lg bg-accent/15 text-accent text-lg">📺</span>
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-accent transition-colors">Bilibili</span>
                        <span className="text-xs text-[var(--text-muted)] truncate">是阿鲲酱鸭</span>
                      </span>
                      <span className="ml-auto text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform">↗</span>
                    </a>

                    {/* GitHub */}
                    <a
                      href="https://github.com/akunqwq"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="这是我的GitHub主页~"
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-gray-400/50 hover:bg-gray-500/5 transition-all duration-200"
                    >
                      <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-lg bg-gray-500/15 text-gray-700 dark:text-gray-200 text-lg">🐙</span>
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">GitHub</span>
                        <span className="text-xs text-[var(--text-muted)] truncate">akunqwq</span>
                      </span>
                      <span className="ml-auto text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform">↗</span>
                    </a>

                    {/* QQ */}
                    <div
                      title="这是我的QQ号"
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-sky-400/50 hover:bg-sky-500/5 transition-all duration-200"
                    >
                      <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-lg bg-sky-500/15 text-sky-500 text-lg">💬</span>
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">QQ</span>
                        <span className="text-xs text-[var(--text-muted)] truncate">2633640385</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
