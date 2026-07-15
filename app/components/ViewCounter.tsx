/**
 * ViewCounter.tsx - 阅读量统计组件（Supabase 版）
 * ================================================
 *
 * 规则：进入详情页先只读当前阅读量并展示；
 * 只有在页面停留满 2 分钟后才 +1（提前离开不计数）。
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

// 阅读满多少秒才计入一次阅读量
const COUNT_AFTER_SECONDS = 120

export default function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null)
  const countedSlugRef = useRef<string | null>(null)

  useEffect(() => {
    if (!slug || !supabase) return
    const db = supabase

    let active = true
    setViews(null)

    // 1) 先只读当前阅读量（不 +1），立即展示
    const fetchViews = async () => {
      try {
        const { data, error } = await db
          .from('article_views')
          .select('views')
          .eq('slug', slug)
          .maybeSingle() // 0 行时不报错，返回 null

        if (!active) return

        if (error) {
          // 查询出错（RLS / 网络等），显示 0 不阻塞渲染
          setViews(0)
          return
        }

        // 有记录 → 显示实际值；无记录 → 显示 0
        setViews(data?.views ?? 0)
      } catch {
        if (active) setViews(0)
      }
    }
    fetchViews()

    // 2) 阅读满 2 分钟才 +1
    const timer = setTimeout(async () => {
      if (countedSlugRef.current === slug) return
      countedSlugRef.current = slug

      try {
        const { data, error } = await db.rpc('increment_view', {
          target_slug: slug,
        })

        if (!error && data !== null) {
          setViews(data)
        }
      } catch {
        // 忽略异常
      }
    }, COUNT_AFTER_SECONDS * 1000)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [slug])

  // 还没拿到数据，不显示
  if (views === null) return null

  const formattedViews = views >= 1000
    ? (views / 1000).toFixed(1) + 'k'
    : String(views)

  return (
    <span className="inline-flex items-center ml-4 text-[var(--text-secondary)]">
      👁 {formattedViews}
    </span>
  )
}
