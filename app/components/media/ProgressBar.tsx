"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMedia } from "./MediaProvider";
import { formatTime } from "./utils";

export default function ProgressBar() {
  const m = useMedia();
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const ratioFromEvent = useCallback((clientX: number): number => {
    const el = barRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }, []);

  // 拖拽时监听全局事件，保证在进度条外释放也能正确结束
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) =>
      m.seek(ratioFromEvent(e.clientX) * (m.duration || 0));
    const up = () => setDragging(false);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, [dragging, m.seek, m.duration]);

  const onDown = (e: React.MouseEvent) => {
    setDragging(true);
    m.seek(ratioFromEvent(e.clientX) * (m.duration || 0));
  };
  const onMove = (e: React.MouseEvent) => {
    setHoverX(e.clientX);
    if (dragging) m.seek(ratioFromEvent(e.clientX) * (m.duration || 0));
  };
  const onLeave = () => {
    setHoverX(null);
    if (!dragging) setDragging(false);
  };

  const played = m.duration ? m.currentTime / m.duration : 0;
  const buffered = m.duration ? m.buffered / m.duration : 0;
  const hoverRatio =
    hoverX != null ? ratioFromEvent(hoverX) : 0;

  return (
    <div
      ref={barRef}
      className="group relative h-4 flex items-center cursor-pointer touch-none"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* 轨道 */}
      <div className="absolute left-0 right-0 h-1.5 rounded-full bg-white/20" />
      {/* 缓冲 */}
      <div
        className="absolute left-0 h-1.5 rounded-full bg-white/30"
        style={{ width: `${buffered * 100}%` }}
      />
      {/* 已播放 */}
      <div
        className="absolute left-0 h-1.5 rounded-full bg-accent"
        style={{ width: `${played * 100}%` }}
      />
      {/* hover 预览时间 */}
      {hoverX != null && (
        <div
          className="absolute -top-7 -translate-x-1/2 font-mono text-xs text-white bg-black/70 px-1.5 py-0.5 rounded"
          style={{ left: `${hoverRatio * 100}%` }}
        >
          {formatTime(hoverRatio * (m.duration || 0))}
        </div>
      )}
      {/* 拖拽手柄 */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow transition-transform ${
          dragging || hoverX != null ? "scale-125" : "scale-100"
        }`}
        style={{ left: `calc(${played * 100}% - 6px)` }}
      />
    </div>
  );
}
