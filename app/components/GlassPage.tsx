import type { ReactNode } from "react";

// 全站统一的「毛玻璃上浮」容器：子页面内容用它骑在 GlobalHero 底部，
// -mt-24 md:-mt-32 使其上浮压住 Hero 下沿（与首页大堂同一套语言）。
// maxWidth 全站统一为 max-w-[1400px]（与首页内容区同宽，视觉一致）。
export default function GlassPage({
  children,
  maxWidth = "max-w-[1400px]",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className={`relative z-20 ${maxWidth} mx-auto px-6 -mt-24 md:-mt-32 pb-10`}>
      {/* 霓虹微边框：1px 渐变描边 wrapper，让玻璃卡片浮在沉浸背景上 */}
      <div className="glass-glow rounded-3xl p-[1px]">
        <div className="glass-panel glass-shine rounded-[23px] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
