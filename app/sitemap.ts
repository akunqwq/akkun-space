import type { MetadataRoute } from 'next'
import { getPostsIndex } from '@/lib/posts'
import { navItems } from '@/lib/nav'

// 站点基础 URL：优先读环境变量，未配置时回退到默认域名
// 换域名只需在 .env.local 设置 NEXT_PUBLIC_SITE_URL，无需改代码
const baseUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.akkun.online'
)

export default function sitemap(): MetadataRoute.Sitemap {
  // 用构建期索引（data/posts.json）取元数据，避免在 sitemap 生成时编译所有 MDX
  const posts = getPostsIndex().filter((p) => p.type !== "news")

  // 基础页面：路由与 sitemap 配置来自单一数据源 data/site/nav.json
  const staticPages: MetadataRoute.Sitemap = navItems.map((item) => ({
    url: new URL(item.href, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: item.sitemap.changeFrequency as 'daily' | 'weekly' | 'monthly',
    priority: item.sitemap.priority,
  }))

  // 文章页面
  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: new URL(`/articles/${post.slug}`, baseUrl).toString(),
    lastModified: new Date(post.date),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...postPages]
}
