'use client';

import { useEffect, useRef } from 'react';

export default function Live2DWidget() {
  const desktopCanvasRef = useRef<HTMLCanvasElement>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);

  // 绘制占位内容的通用函数
  const drawPlaceholder = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 使用CSS变量获取文本颜色，支持主题切换
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666';

      ctx.fillStyle = textColor;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Live2D角色', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText('待做', canvas.width / 2, canvas.height / 2 + 10);
    }
  };

  useEffect(() => {
    // 为桌面端和移动端画布绘制占位内容
    drawPlaceholder(desktopCanvasRef.current);
    drawPlaceholder(mobileCanvasRef.current);

    // TODO: 后续添加鼠标追踪功能
    const handleMouseMove = (_e: MouseEvent) => {
      // 鼠标追踪逻辑将在这里实现
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* 桌面端 - 固定在左下角 */}
      <div className="hidden md:block fixed left-4 bottom-4 z-10">
        <canvas
          ref={desktopCanvasRef}
          width={200}
          height={250}
          className="bg-[var(--card-bg)] backdrop-blur-sm rounded-lg shadow-lg border border-[var(--border-color)] transition-transform duration-200 hover:scale-105 cursor-pointer"
        />
        <div className="text-xs text-[var(--text-muted)] text-center mt-2">
          Live2D 角色
        </div>
      </div>

      {/* 移动端 - 集成到移动端布局中 */}
      <div className="md:hidden flex items-center">
        <canvas
          ref={mobileCanvasRef}
          width={160}
          height={200}
          className="bg-[var(--card-bg)] backdrop-blur-lg rounded-3xl shadow-sm border border-[var(--border-color)] transition-transform duration-200 hover:scale-105 cursor-pointer"
        />
      </div>
    </>
  );
}