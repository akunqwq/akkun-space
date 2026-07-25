"use client";

import { useRef, useCallback } from "react";
import { Play } from "lucide-react";
import { useMedia } from "./MediaProvider";
import CoverImage from "./CoverImage";

const ORB_SIZE = 56;
const STROKE = 3;
const RADIUS = (ORB_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const LONG_PRESS_MS = 500;
const DRAG_THRESHOLD = 5; // px — 超过此距离判定为拖拽，取消长按

/**
 * BubblePlayer — 极简状态挂件 + 长按恢复入口
 *
 * 交互意图层级（Intent Hierarchy）：
 * - 单击 (Click <500ms, 无拖动) → 播放/暂停（形态不变）
 * - 长按 (Long Press ≥500ms, 无拖动) → 展开为 Mini 浮层
 * - 拖动 (Drag >5px) → 移动位置（取消长按定时器）
 * - 封面旋转(播放时) + SVG 进度环 = 状态指示
 */
export default function BubblePlayer() {
  const m = useMedia();
  const item = m.currentItem;
  if (!item) return null;

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressFired = useRef(false);

  const posRef = useRef(m.floating.bubble);
  posRef.current = m.floating.bubble;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      const pos = posRef.current;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
        moved: false,
      };

      isLongPressFired.current = false;

      // 启动长按定时器
      longPressTimer.current = setTimeout(() => {
        isLongPressFired.current = true;
        m.setMode("mini");
      }, LONG_PRESS_MS);
    },
    [m],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

      const d = dragRef.current;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const dist = Math.hypot(dx, dy);

      // 移动超过阈值 → 判定为拖拽，取消长按
      if (!d.moved && dist > DRAG_THRESHOLD) {
        d.moved = true;
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }

      if (!d.moved) return;

      const newX = Math.max(
        0,
        Math.min(window.innerWidth - ORB_SIZE, d.origX + dx),
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - ORB_SIZE, d.origY + dy),
      );
      m.setBubblePos(newX, newY);
    },
    [m],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);

      // 清除长按定时器
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // 长按已触发 → 无需额外操作
      if (isLongPressFired.current) return;

      // 拖动结束 → 位置已由 onPointerMove 实时更新
      if (dragRef.current.moved) return;

      // 纯单击 → 播放/暂停
      m.toggle();
    },
    [m],
  );

  const progress = m.duration > 0 ? m.currentTime / m.duration : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className="fixed z-[110] select-none"
      style={{
        left: m.floating.bubble.x,
        top: m.floating.bubble.y,
        width: ORB_SIZE,
        height: ORB_SIZE,
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="relative w-full h-full"
        title={`${item.title} — ${item.artist}（单击播放/暂停 · 长按展开）`}
      >
        {/* 封面 — 播放时旋转 */}
        <CoverImage
          item={item}
          className="absolute inset-[2px] rounded-full object-cover shadow-lg animate-spin-slow"
          style={{ animationPlayState: m.isPlaying ? "running" : "paused" }}
        />

        {/* SVG 进度环 */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={ORB_SIZE}
          height={ORB_SIZE}
          viewBox={`0 0 ${ORB_SIZE} ${ORB_SIZE}`}
        >
          <circle
            cx={ORB_SIZE / 2}
            cy={ORB_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="text-[var(--accent)]/70"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>

        {/* 暂停指示 — 球体中心播放图标 */}
        {!m.isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Play className="w-4 h-4 text-white drop-shadow-md ml-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}
