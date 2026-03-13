import Hero from "./components/Hero";
import { getAllPosts, getPostBySlug } from "../lib/posts";
import { formatDate } from "../lib/formatDate";
import MDXRenderer from "./components/MDXRenderer";

export default function Home() {
  const allPosts = getAllPosts(); // 已按 order 升序、创建时间排序

  const postsWithContent = allPosts
    .map(post => getPostBySlug(post.slug))
    .filter(Boolean) as any[];

  return (
    <div className="px-6 pt-24 md:pt-10 pb-10 space-y-10">

      {/* 顶部轮播图 */}
      <Hero />

      {/* 全文章内容流（桌面端三栏布局） */}
      <section className="mt-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* 左侧固定卡片 */}
          <div className="hidden md:block md:col-span-3 sticky top-1/4 h-fit">
            <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)]
                        hover:shadow-md transition">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">🌸 我的兴趣</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                ACG / 纯音乐 / MMD / 原神 / 敲代码
                <br />才...才不是猫娘喵。
              </p>
            </div>
          </div>

          {/* 中间文章内容流 */}
          <div className="md:col-span-6 space-y-16">
            {postsWithContent.map((post) => (
              <article key={post.slug} className="pb-10 border-b border-[var(--border-color)]">
                {/* 文章标题和元数据 */}
                <header className="mb-6">
                  <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
                    {post.title}
                  </h1>
                  <div className="flex items-center justify-center text-sm text-[var(--text-secondary)]">
                    {post.author && (
                      <span className="mr-4">
                        作者: {post.author}
                      </span>
                    )}
                    <time dateTime={post.date}>
                      {formatDate(post.date)}
                    </time>
                  </div>
                  {post.summary && (
                    <div className="mt-4 mb-6">
                      <p className="text-lg text-[var(--text-secondary)] italic whitespace-pre-wrap text-center ">
                        {post.summary}
                      </p>
                    </div>
                  )}
                </header>
                {/* 文章内容 */}
                <MDXRenderer source={post.bodyRaw} />
              </article>
            ))}
          </div>

          {/* 右侧固定卡片 */}
          <div className="hidden md:block md:col-span-3 sticky top-1/4 h-fit">
            <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-[var(--border-color)]
                        hover:shadow-md transition">
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
          </div>

        </div>
      </section>





    </div>
  );
}
