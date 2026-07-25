'use client'

import { ArrowUp } from 'lucide-react'

/**
 * BackToTop.tsx - 返回顶部按钮
 * 锚定在文章右下角，随文章一起滚动（由父容器 absolute 定位控制显隐/位置）
 */
export default function BackToTop() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="返回顶部"
      title="返回顶部"
      className="
        group flex flex-col items-center justify-center gap-0.5
        p-2.5 rounded-full
        bg-[var(--theme-toggle-bg)]/80
        hover:bg-[var(--theme-toggle-hover)]
        backdrop-blur-sm
        shadow-lg hover:shadow-xl
        transition-all duration-200
        focus:outline-none
      "
    >
      <ArrowUp className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-accent transition-colors duration-200" />
    </button>
  )
}
