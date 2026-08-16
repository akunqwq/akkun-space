'use client'

import { usePathname } from 'next/navigation'
import BackToTop from './BackToTop'
import LikeButton from './LikeButton'

/**
 * FloatingActions.tsx - 全局悬浮操作按钮组
 * - 固定在视口右下角，位于主题切换按钮正上方，垂直排列
 * - 滚动时始终可见，不跟随文章移动
 * - 高 z-index，不会被 Footer / 留言板 等 fixed 元素遮挡
 * - 仅在文章页（/articles/<slug>）渲染点赞按钮，返回顶部按钮全局可见
 */
export default function FloatingActions() {
  const pathname = usePathname()
  const match = pathname?.match(/^\/articles\/(.+)$/)
  const slug = match ? match[1] : null

  return (
    <div className="fixed bottom-20 right-4 z-[110] flex flex-col items-center gap-3">
      <BackToTop />
      {slug && <LikeButton slug={slug} />}
    </div>
  )
}
