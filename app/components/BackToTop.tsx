'use client'

import { useCallback } from 'react'
import { ArrowUp } from 'lucide-react'
import { useScrollVisibility } from '@/lib/hooks/useScrollVisibility'

const SHOW_THRESHOLD = 400


export default function BackToTop() {
  // 滚动可见性由 useSyncExternalStore 订阅，无需 useState/useEffect
  const visible = useScrollVisibility(SHOW_THRESHOLD)

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <button
      onClick={scrollToTop}
      aria-label="返回顶部"
      title="返回顶部"
      className={`
        group flex flex-col items-center justify-center gap-0.5
        p-2.5 rounded-full
        bg-[var(--theme-toggle-bg)]/80
        hover:bg-[var(--theme-toggle-hover)]
        backdrop-blur-sm
        shadow-lg hover:shadow-xl
        focus:outline-none
        transition-all duration-300 ease-out
        ${visible
          ? 'opacity-100 pointer-events-auto translate-y-0'
          : 'opacity-0 pointer-events-none translate-y-2'}
      `}
    >
      <ArrowUp className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-accent transition-colors duration-200" />
    </button>
  )
}
