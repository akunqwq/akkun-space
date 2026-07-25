import type { MetadataRoute } from 'next'
import { getPostsIndex } from '@/lib/posts'

// 站点基础 URL：优先读环境变量，未配置时回退到默认域名
// 换域名只需在 .env.local 设置 NEXT_PUBLIC_SITE_URL，无需改代码
const baseUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.akkun.online'
)

export default function sitemap(): MetadataRoute.Sitemap {
  // 用构建期索引（data/posts.json）取元数据，避免在 sitemap 生成时编译所有 MDX
  const posts = getPostsIndex().filter((p) => p.type !== "news")

  // 基础页面
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl.toString(), lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: new URL('/articles', baseUrl).toString(), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: new URL('/about', baseUrl).toString(), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: new URL('/changelog', baseUrl).toString(), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: new URL('/media', baseUrl).toString(), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: new URL('/media/music', baseUrl).toString(), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // 文章页面
  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: new URL(`/articles/${post.slug}`, baseUrl).toString(),
    lastModified: new Date(post.date),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...postPages]
}
