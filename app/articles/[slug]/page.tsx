import Image from "next/image";
import type { Metadata } from "next";
import { getPostBySlug, getAllPosts } from "../../../lib/posts";
import { formatDate } from "../../../lib/formatDate";
import MDXRenderer from "../../components/MDXRenderer";
import ViewCounter from "../../components/ViewCounter";
import { extractToc } from "../../../lib/toc";
import TableOfContents from "../../components/TableOfContents";
import GlassPage from "../../components/GlassPage";
import { notFound } from "next/navigation";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// 生成静态路径
export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 生成静态元数据
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "文章未找到" };
  }

  // 资讯存档禁止搜索引擎索引
  if (post.type === "news") {
    return {
      title: post.title,
      description: post.summary,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  // 1. 数据获取
  const { slug } = await params;
  const post = getPostBySlug(slug);

  // 2. 数据校验
  if (!post) {
    notFound();
  }

  // 3. 派生数据
  const headings = extractToc(post.body.raw);

  // 4. 渲染
  return (
    <GlassPage maxWidth="max-w-[1400px]">
      {/* 文章头部 */}
      <header className="mb-12">
        <div className="mb-8">
          {post.cover && (
            <Image
              src={post.cover}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-auto rounded-2xl shadow-[var(--panel-shadow-sm)]"
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
              <span className="text-sm">{post.author}</span>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-[var(--tag-bg)] text-[var(--tag-text)] text-xs rounded-full whitespace-nowrap"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <time dateTime={post.date} className="text-sm text-accent">
              {formatDate(post.date)}
            </time>
            <ViewCounter slug={slug} />
          </div>

          {post.summary && (
            <p className="text-lg text-[var(--text-secondary)] italic whitespace-pre-wrap">
              {post.summary}
            </p>
          )}
        </div>
      </header>

      {/* 目录 */}
      <TableOfContents headings={headings} />

      {/* 文章内容 */}
      <article className="relative bg-[var(--card-bg)] backdrop-blur-sm rounded-2xl p-8 shadow-[var(--panel-shadow-sm)] border border-[var(--border-color)] text-[var(--text-primary)] max-w-3xl mx-auto">
        <div className="mdx-content">
          <MDXRenderer source={post.body.raw} />
        </div>
      </article>
    </GlassPage>
  );
}
