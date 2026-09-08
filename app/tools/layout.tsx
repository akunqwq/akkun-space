import type { ReactNode } from 'react';

import GlassPage from '@/app/components/GlassPage';
import ToolsSubNav from '@/app/components/tools/ToolsSubNav';

/**
 * /tools 区统一外壳：玻璃容器 + 子导航。
 * 各子页面只渲染内部内容（不含 GlassPage），由本 layout 统一包裹，
 * 保证工具首页 / B 站 UP / 游戏财报的视觉与导航一致。
 */
export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <GlassPage maxWidth="max-w-[1400px]">
      <ToolsSubNav />
      {children}
    </GlassPage>
  );
}
