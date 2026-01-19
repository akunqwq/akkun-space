import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = path.join(process.cwd(), "content/posts");

// 文章元数据类型
export interface PostMeta {
  title: string;
  date: string;
  author?: string;
  cover?: string;
  summary?: string;
  tags?: string[];
  [key: string]: any;
}

// 文章列表项类型
export interface PostListItem extends PostMeta {
  slug: string;
  summary: string;
  readingTime: number;
}

// 文章详情类型
export interface Post extends PostMeta {
  slug: string;
  url: string;
  readingTime: number;
  body: {
    raw: string;
  };
  bodyRaw: string;
}

// 获取所有文章（按日期降序排列）
export function getAllPosts(): PostListItem[] {
  try {
    if (!fs.existsSync(postsDir)) {
      return [];
    }

    const files = fs.readdirSync(postsDir);
    const mdxFiles = files.filter(file => /\.mdx?$/.test(file));

    return mdxFiles
      .map((file) => {
        const slug = file.replace(/\.mdx?$/, "");
        const filePath = path.join(postsDir, file);
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data: meta, content } = matter(raw);

        // 计算阅读时间
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);

        return {
          slug,
          ...meta,
          summary: meta.summary ?? content.slice(0, 100) + '...',
          readingTime,
        } as unknown as PostListItem;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
}

// 根据 slug 获取单篇文章
export function getPostBySlug(slug: string): Post | null {
  try {
    if (!slug || typeof slug !== 'string') {
      return null;
    }

    const filePath = path.join(postsDir, slug + ".mdx");
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data: meta, content } = matter(raw);

    // 计算阅读时间
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);

    return {
      slug,
      url: `/articles/${slug}`,
      ...meta,
      body: {
        raw: content,
      },
      bodyRaw: content,
      readingTime,
    } as Post;
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

// 获取文章总数
export function getPostsCount(): number {
  return getAllPosts().length;
}

// 根据标签获取文章
export function getPostsByTag(tag: string): PostListItem[] {
  return getAllPosts().filter((post) => 
    post.tags && post.tags.includes(tag)
  );
}

// 获取所有标签
export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllPosts().forEach((post) => {
    if (post.tags) {
      post.tags.forEach((tag) => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
}

// 搜索文章
export function searchPosts(query: string): PostListItem[] {
  const lowercaseQuery = query.toLowerCase();
  return getAllPosts().filter((post) =>
    post.title.toLowerCase().includes(lowercaseQuery) ||
    (post.summary && post.summary.toLowerCase().includes(lowercaseQuery)) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
  );
}