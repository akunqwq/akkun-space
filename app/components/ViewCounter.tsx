/**
 * ViewCounter.tsx - 阅读量统计组件（Supabase 版）
 * ================================================
 *
 * 直接调用 Supabase 的 RPC 函数来统计阅读量
 * 不再需要 Flask 后端！
 *
 * 规则：进入详情页先只读当前阅读量并展示；
 * 只有在页面停留满 2 分钟后才 +1（提前离开不计数）。
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 阅读满多少秒才计入一次阅读量
const COUNT_AFTER_SECONDS = 120

/**
 * ViewCounter 组件
 * @param props.slug - 文章的 slug（唯一标识符）
 */
export default function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null)
  // 记录已经为哪个 slug 计过数，避免同一 slug 重复 +1（含严格模式双调用）
  const countedSlugRef = useRef<string | null>(null)

  useEffect(() => {
    if (!slug) return

    let active = true
    // slug 变化时重置展示，避免残留上一篇的数字
    setViews(null)

    // 1) 先只读当前阅读量（不 +1），立即展示
    const fetchViews = async () => {
      try {
        const { data, error } = await supabase
          .from('article_views')
          .select('views')
          .eq('slug', slug)
          .single()

        if (active && !error && data) {
          setViews(data.views)
        }
      } catch {
        // 读取失败不打断，2 分钟后由 increment_view 兜底展示
      }
    }
    fetchViews()

    // 2) 阅读满 2 分钟才 +1
    const timer = setTimeout(async () => {
      if (countedSlugRef.current === slug) return
      countedSlugRef.current = slug

      try {
        const { data, error } = await supabase.rpc('increment_view', {
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

  // 格式化数字（超过 1000 显示为 1.2k 这样的格式）
  const formattedViews = views >= 1000
    ? (views / 1000).toFixed(1) + 'k'
    : String(views)

  return (
    <span className="inline-flex items-center ml-4 text-[var(--text-secondary)]">
      👁 {formattedViews}
    </span>
  )
}
