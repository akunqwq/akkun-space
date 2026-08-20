import { socialUrls } from '@/lib/socials'
import seoData from '@/data/site/seo.json'

interface StructuredDataProps {
  type: 'website' | 'blog' | 'person'
}

export default function StructuredData({ type }: StructuredDataProps) {
  const baseUrl = 'https://www.akkun.online' 

  const getStructuredData = () => {
    switch (type) {
      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: '阿鲲 の小窝',
          url: baseUrl,
          description: '阿鲲の小窝 - 一个专注于 ACG、前端技术和二次元文化的个人博客',
          author: {
            '@type': 'Person',
            name: '阿鲲',
            url: `${baseUrl}/about`
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        }

      case 'blog':
        return {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: '阿鲲 の小窝',
          url: baseUrl,
          description: '阿鲲の小窝 - 一个专注于 ACG、前端技术和二次元文化的个人博客',
          author: {
            '@type': 'Person',
            name: '阿鲲'
          },
          publisher: {
            '@type': 'Person',
            name: '阿鲲'
          }
        }

      case 'person':
        return {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: '阿鲲',
          url: `${baseUrl}/about`,
          description: '前端开发者，ACG爱好者，专注于 React、Next.js 等技术',
          sameAs: socialUrls,
          knowsAbout: seoData.knowsAbout
        }

      default:
        return {}
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData())
      }}
    />
  )
}