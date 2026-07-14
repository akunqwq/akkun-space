import Hero from "./components/Hero";
import { getPostsIndex, getPostsMeta } from "../lib/posts";
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
  const stats =
    meta?.stats ?? (() => {
      const s: Record<string, number> = { total: allPosts.length };
      for (const p of allPosts) s[p.type] = (s[p.type] ?? 0) + 1;
      return s as any;
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

  return (
    <div className="px-6 pt-24 md:pt-10 pb-10 space-y-10">
      {/* 顶部轮播图 */}
      <Hero />

      {/* 文章摘要卡片流（桌面端三栏布局） */}
      <section className="mt-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* 左侧固定卡片 */}
          <div className="hidden md:block md:col-span-3 sticky top-1/4 h-fit">
            <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)] hover:shadow-md transition">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">🌸 我的兴趣</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                ACG / 纯音乐 / MMD / 原神 / 敲代码
                <br />才...才不是猫娘喵。
              </p>

              {/* 站点统计 */}
              <div className="mt-6 pt-5 border-t border-[var(--border-color)]">
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

          {/* 中间文章卡片流 */}
          <div className="md:col-span-6 space-y-8">
            {/* 主信息流标题 */}
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">✍️ 最近创作</h2>
              <a href="/articles" className="text-sm text-[var(--link-color)] hover:underline">查看全部 →</a>
            </div>

            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}

            {/* 分页 */}
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>

          {/* 右侧固定卡片 */}
          <div className="hidden md:block md:col-span-3 sticky top-1/4 h-fit">
            <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)] hover:shadow-md transition">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">💖 关注我</h2>
              <p className="text-[var(--text-secondary)]">你可以在这里找到我：</p>
              <ul className="mt-2 text-[var(--link-color)] space-y-1">
                <li><a href="https://space.bilibili.com/286757068" target="_blank" title="点击跳转到我的bilibili主页~">- Bilibili:是阿鲲酱鸭</a></li>
              </ul>
              <ul className="mt-2 text-black space-y-1">
                <li><a href="https://github.com/akunqwq" target="_blank" title="这是我的GitHub主页~">- GiHub:akunqwq</a></li>
              </ul>
              <ul className="mt-2 text-sky-500 space-y-1">
                <li title="这是我的QQ号">- QQ:2633640385</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 资讯存档：低权重区，不抢占首页第一印象 */}
      {newsPosts.length > 0 && (
        <section className="mt-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto md:max-w-none md:ml-[25%] md:w-[50%]">
            <details className="group bg-[var(--card-bg)] backdrop-blur-lg rounded-2xl border border-[var(--border-color)] p-5">
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
                      className="text-[var(--text-secondary)] hover:text-violet-500 transition-colors"
                    >
                      · {post.title}
                    </a>
                  </li>
                ))}
                <li className="pt-1">
                  <a href="/articles?type=news" className="text-[var(--link-color)] hover:underline text-xs">
                    查看全部资讯存档 →
                  </a>
                </li>
              </ul>
            </details>
          </div>
        </section>
      )}
    </div>
  );
}
