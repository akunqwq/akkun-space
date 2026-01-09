import Hero from "./components/Hero";
import Link from "next/link";
import { getAllPosts, getPostBySlug, type PostListItem } from "../lib/posts";
import MDXRenderer from "./components/MDXRenderer";

export default function Home() {
  const allPosts = getAllPosts(); // 获取所有文章
  const latestPosts = allPosts.slice(0, 3); // 获取最新的3篇文章

  // 按日期从新到旧排序，然后获取完整内容
  const postsWithContent = allPosts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(post => getPostBySlug(post.slug))
    .filter(Boolean) as any[];

  return (
    <div className="px-6 pt-24 md:pt-10 pb-10 space-y-10">

      {/* 顶部轮播图 */}
      <Hero />

      {/* 顶部卡片 - 桌面端显示最近文章，移动端隐藏其他卡片 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">

        {/* 卡片 1 桌面端显示，移动端隐藏  */}
        <div className="hidden md:block bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)]
                        hover:shadow-md transition w-full max-w-none md:max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">🌸 我的兴趣</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            ACG / 纯音乐 / MMD / 原神 / 敲代码
            <br />才...才不是猫娘喵。
          </p>
        </div>


        {/* 卡片 2: 最新发布 */}
        <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)]
                        hover:shadow-md transition w-full max-w-none md:max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">📘 最新发布</h2>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            {latestPosts.length > 0 ? (
              latestPosts.map((post: PostListItem, index: number) => (
                <li key={post.slug} className="flex items-center gap-3 text-sm">
                  <Link
                    href={`/articles/${post.slug}`}
                    className={`cursor-pointer transition-colors truncate hover:text-pink-500`}
                  >
                    {index === 0 && <span className="mr-1 text-xs bg-pink-400 text-white px-1.5 py-0.5 rounded">NEW</span>}
                    {post.title}
                  </Link>
                  <span className="text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(post.date).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-[var(--text-muted)]">暂无文章</li>
            )}
          </ul>
        </div>

        {/* 卡片 3 - 桌面端显示，移动端隐藏 */}
        <div className="hidden md:block bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)]
                        hover:shadow-md transition w-full max-w-none md:max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">💖 关注我</h2>
          <p className="text-[var(--text-secondary)]">你可以在这里找到我：</p>
          <ul className="mt-2 text-pink-500 space-y-1">
            <li><a href="https://space.bilibili.com/286757068" target="_blank" title="点击跳转到我的bilibili主页~">- Bilibili:是阿鲲酱鸭</a></li>
          </ul>
          <ul className="mt-2 text-black space-y-1">
            <li><a href="https://github.com/akunqwq" target="_blank" title="这是我的GitHub主页~">- GiHub:akunqwq</a></li>
          </ul>
          <ul className="mt-2 text-blue-500 space-y-1">
            <li title="这是我的QQ号">- QQ:2633640385</li>
          </ul>
        </div>

      </section>

      {/* 全文章内容流和最近评论（桌面端三栏布局） */}
      <section className="mt-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* 左侧占位 - 预留给未来功能 */}
          <div className="hidden md:block md:col-span-4">
            {/* 未来功能占位 */}
          </div>

          {/* 中间文章内容流 */}
          <div className="md:col-span-4 space-y-16">
            {postsWithContent.map((post) => (
              <article key={post.slug} className="pb-10 border-b border-[var(--border-color)]">
                <MDXRenderer source={post.bodyRaw} />
              </article>
            ))}
          </div>


        </div>
      </section>

      {/* 移动端专用卡片区域 - 在文章下方显示 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-28 pb-2 md:hidden">

        {/* 卡片 2：我的兴趣 */}
        <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)]
                        hover:shadow-md transition w-full max-w-[360px] mx-auto">
          <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">🌸 我的兴趣</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            ACG / 纯音乐 / MMD / 原神 / 敲代码
            <br />才...才不是猫娘喵。
          </p>
        </div>

        {/* 卡片 3：关注我 */}
        <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)]
                        hover:shadow-md transition w-full max-w-[360px] mx-auto">
          <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">💖 关注我</h2>
          <p className="text-[var(--text-secondary)]">你可以在这里找到我：</p>
          <ul className="mt-2 text-pink-500 space-y-1">
            <li><a href="https://space.bilibili.com/286757068" target="_blank" title="点击跳转到我的bilibili主页~">- Bilibili:是阿鲲酱鸭</a></li>
          </ul>
          <ul className="mt-2 text-black space-y-1">
            <li><a href="https://github.com/akunqwq" target="_blank" title="这是我的GitHub主页~">- GiHub:akunqwq</a></li>
          </ul>
          <ul className="mt-2 text-blue-500 space-y-1">
            <li title="这是我的QQ号">- QQ:2633640385</li>
          </ul>
        </div>

      </section>



    </div>
  );
}
