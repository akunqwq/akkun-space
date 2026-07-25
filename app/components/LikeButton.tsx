/**
 * LikeButton.tsx - 抖音风点赞按钮（Supabase 版）
 * ================================================
 *
 * 圆形半透明背景 + 毛玻璃 + 阴影
 * 竖向排列：爱心在上，数字在下，垂直居中
 * localStorage 防重复点赞
 */

'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
    setMounted(true)
    setIsLiked(getLikedSlugs().has(slug))
  }, [slug])

  // 获取点赞数
  useEffect(() => {
    if (!slug || !mounted || !supabase) return
    const db = supabase

    const fetchLikes = async () => {
      try {
        const { data, error } = await db
          .from('article_likes')
          .select('likes')
          .eq('slug', slug)
          .maybeSingle()

        if (error || !data) {
          setLikes(0)
        } else {
          setLikes(data.likes)
        }
      } catch {
        setLikes(0)
      }
    }

    fetchLikes()
  }, [slug, mounted])

  const handleLike = async () => {
    if (!mounted || isLiked || !supabase) return

    const { data, error } = await supabase.rpc('toggle_like', {
      target_slug: slug,
    })

    if (error) return

    if (data !== null) {
      setLikes(data)
      setIsLiked(true)
      const liked = getLikedSlugs()
      liked.add(slug)
      saveLikedSlugs(liked)
    }
  }

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
            ? 'fill-accent text-accent'
            : 'fill-none text-[var(--text-secondary)] group-hover:text-accent'
        }`}
      />
      <span
        className={`text-xs font-medium tabular-nums leading-none transition-colors duration-200 ${
          isLiked ? 'text-accent' : 'text-[var(--text-secondary)]'
        }`}
      >
        {formattedLikes}
      </span>
    </button>
  )
}
