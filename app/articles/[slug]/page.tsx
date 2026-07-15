import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPostBySlug, getAllPosts, type Post } from "../../../lib/posts";
import { formatDate } from "../../../lib/formatDate";
import MDXRenderer from "../../components/MDXRenderer";
import ViewCounter from "../../components/ViewCounter";

// 生成静态路径
export async function generateStaticParams() {
  const posts = getAllPosts();
  
  return posts.map((post: any) => ({
    slug: post.slug,
  }));
}

// 生成静态元数据
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  // 资讯存档（type=news）为新闻搬运内容，禁止搜索引擎索引
  if (post.type === "news") {
    return {
      title: `${post.title}`,
      description: post.summary,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${post.title} - 阿鲲 の小窝`,
    description: post.summary,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  
  // 解包 params
  const resolvedParams = await params;
  
  // 确保 params.slug 存在
  if (!resolvedParams?.slug) {
    return (
      <main className="max-w-4xl mx-auto px-6 pt-24 md:pt-12 pb-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">无效的文章链接</h1>
          <p className="text-[var(--text-secondary)] mb-8">文章链接格式不正确。</p>
          <Link
            href="/articles"
            className="inline-block px-6 py-3 bg-[var(--btn-primary)] text-white rounded-lg hover:bg-[var(--btn-primary-hover)] transition-colors"
          >
            返回文章列表
          </Link>
        </div>
      </main>
    );
  }

  const post: Post | null = getPostBySlug(resolvedParams.slug);

  if (!post) {
    return (
      <main className="max-w-4xl mx-auto px-6 pt-24 md:pt-12 pb-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">文章未找到</h1>
          <p className="text-[var(--text-secondary)] mb-8">抱歉，您查找的文章不存在。</p>
          <p className="text-sm text-[var(--text-muted)] mb-8">Slug: {resolvedParams.slug}</p>
          <Link
            href="/articles"
            className="inline-block px-6 py-3 bg-[var(--btn-primary)] text-white rounded-lg hover:bg-[var(--btn-primary-hover)] transition-colors"
          >
            返回文章列表
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 pt-24 md:pt-12 pb-12">
      {/* 文章头部 */}
      <header className="mb-12">
        <div className="mb-8">
          {post.cover && (
            <Image
              src={post.cover}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-auto rounded-2xl shadow-lg"
              priority
            />
          )}
        </div>

        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-[var(--text-primary)]">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[var(--text-secondary)] mb-6">
            {post.author && (
              <>
                <span className="text-sm">{post.author}</span>
              </>
            )}
            {post.tags && post.tags.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 justify-center">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-[var(--tag-bg)] text-[var(--tag-text)] text-xs rounded-full whitespace-nowrap"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </>
            )}
            <time dateTime={post.date} className="text-sm">
              {formatDate(post.date)}
            </time>
            {/* 阅读量统计 - 访问详情页时 +1 */}
            <ViewCounter slug={resolvedParams.slug} />
          </div>

          {post.summary && (
            <p className="text-lg text-[var(--text-secondary)] italic whitespace-pre-wrap">
              {post.summary}
            </p>
          )}
        </div>
      </header>

      {/* 文章内容 */}
      <article className="relative bg-[var(--card-bg)] backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-[var(--border-color)] text-[var(--text-primary)]">
        <div className="mdx-content">
          <MDXRenderer source={post.body.raw} />
        </div>
      </article>

      {/* 文章底部 */}
      <footer className="mt-12 pt-8 border-t border-[var(--border-color)]">
        <div className="text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-[var(--link-color)] hover:text-[var(--link-hover)] transition-colors"
          >
            ← 返回文章列表
          </Link>
        </div>
      </footer>
    </main>
  );
}