/**
 * LikeButton.tsx - 抖音风点赞按钮（Supabase 版）
 * ================================================
 *
 * 参考FloatingThemeToggle的样式风格：
 * - 圆形半透明背景 + 毛玻璃 + 阴影
 * - 竖向排列：爱心在上，数字在下，垂直居中
 * - 未点赞：白色空心爱心 | 已点赞：粉红实心爱心
 * - localStorage 防重复点赞
 */

'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STORAGE_KEY = 'blog_liked_articles'

function getLikedSlugs(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveLikedSlugs(slugs: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs]))
}

export default function LikeButton({ slug }: { slug: string }) {
  const [likes, setLikes] = useState<number>(0)
  const [isLiked, setIsLiked] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    console.log('[LikeButton] mounted, slug:', slug)
    setMounted(true)
    setIsLiked(getLikedSlugs().has(slug))
  }, [slug])

  // 获取点赞数
  useEffect(() => {
    if (!slug || !mounted) return

    const fetchLikes = async () => {
      try {
        console.log('[LikeButton] fetching likes for:', slug)
        const { data, error } = await supabase
          .from('article_likes')
          .select('likes')
          .eq('slug', slug)
          .single()

        if (error || !data) {
          console.log('[LikeButton] no data or error:', error?.message || 'no row')
          setLikes(0)
        } else {
          console.log('[LikeButton] got likes:', data.likes)
          setLikes(data.likes)
        }
      } catch (e) {
        console.log('[LikeButton] exception:', e)
        setLikes(0)
      }
    }

    fetchLikes()
  }, [slug, mounted])

  const handleLike = async () => {
    if (!mounted || isLiked) return

    console.log('[LikeButton] liking:', slug)
    const { data, error } = await supabase.rpc('toggle_like', {
      target_slug: slug,
    })

    if (error) {
      console.log('[LikeButton] like failed:', error.message)
      return
    }

    if (data !== null) {
      console.log('[LikeButton] liked, new count:', data)
      setLikes(data)
      setIsLiked(true)
      const liked = getLikedSlugs()
      liked.add(slug)
      saveLikedSlugs(liked)
    }
  }

  // 挂载后始终显示，不再因为数据没加载完就隐藏
  if (!mounted) return null

  const formattedLikes = likes >= 1000 ? (likes / 1000).toFixed(1) + 'k' : String(likes)

  return (
    <button
      onClick={handleLike}
      disabled={isLiked}
      aria-pressed={isLiked}
      title={isLiked ? '已点赞' : '点赞'}
      className={`
        group flex flex-col items-center justify-center gap-0.5
        p-2.5 rounded-full
        bg-[var(--theme-toggle-bg)]/80
        hover:bg-[var(--theme-toggle-hover)]
        backdrop-blur-sm
        shadow-lg hover:shadow-xl
        transition-all duration-200
        focus:outline-none
        ${isLiked ? 'cursor-default' : 'cursor-pointer'}
      `}
    >
      <Heart
        className={`w-5 h-5 transition-colors duration-200 ${
          isLiked
            ? 'fill-violet-500 text-violet-500'
            : 'fill-none text-[var(--text-secondary)] group-hover:text-violet-400'
        }`}
      />
      <span
        className={`text-xs font-medium tabular-nums leading-none transition-colors duration-200 ${
          isLiked ? 'text-violet-500' : 'text-[var(--text-secondary)]'
        }`}
      >
        {formattedLikes}
      </span>
    </button>
  )
}
