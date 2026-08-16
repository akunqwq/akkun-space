"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Loader2, AlertCircle } from "lucide-react";
import { useMusic } from "./MusicProvider";
import CoverImage from "./CoverImage";
import { PLAYER_NAME } from "./types";

// 收起后的悬浮球（还原 v1.0.0 的 BubblePlayer 设计）：
// 封面播放时旋转 + SVG 进度环；单击播放/暂停，长按展开回底部条，可拖拽并 localStorage 记忆；默认左上。
const FAB_KEY = "music-fab-position";
const ORB_SIZE = 56;
const STROKE = 3;
const RADIUS = (ORB_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const LONG_PRESS_MS = 500;
const DRAG_THRESHOLD = 5; // px — 超过此距离判定为拖拽，取消长按
const MARGIN = 16;

type Pos = { x: number; y: number };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function MusicBubble() {
  const m = useMusic();
  const item = m.currentItem;
  const [pos, setPos] = useState<Pos | null>(null);
  const posRef = useRef<Pos | null>(null);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, moved: false });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressFired = useRef(false);

  // 初始化位置（localStorage 优先，否则默认左上）
  useEffect(() => {
    const headerH =
      document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    let p: Pos = { x: MARGIN, y: headerH + MARGIN };
    const saved = window.localStorage.getItem(FAB_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved) as Pos;
        if (typeof s.x === "number" && typeof s.y === "number") p = s;
      } catch {
        /* ignore */
      }
    }
    const next: Pos = {
      x: clamp(p.x, MARGIN, window.innerWidth - ORB_SIZE - MARGIN),
      y: clamp(p.y, MARGIN, window.innerHeight - ORB_SIZE - MARGIN),
    };
    posRef.current = next;
    setPos(next);
  }, []);

  // 视口变化重新夹紧并持久化
  useEffect(() => {
    const onResize = () => {
      const cur = posRef.current;
      if (!cur) return;
      const next: Pos = {
        x: clamp(cur.x, MARGIN, window.innerWidth - ORB_SIZE - MARGIN),
        y: clamp(cur.y, MARGIN, window.innerHeight - ORB_SIZE - MARGIN),
      };
      posRef.current = next;
      setPos(next);
      persist(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const persist = useCallback((p: Pos) => {
    try {
      window.localStorage.setItem(FAB_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const pos = posRef.current!;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
        moved: false,
      };
      isLongPressFired.current = false;
      // 长按 → 展开回底部条
      longPressTimer.current = setTimeout(() => {
        isLongPressFired.current = true;
        m.toggleMinimize();
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
      const headerH =
        document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const footerH =
        document.querySelector("footer")?.getBoundingClientRect().height ?? 0;
      const newX = clamp(
        d.origX + dx,
        MARGIN,
        window.innerWidth - ORB_SIZE - MARGIN,
      );
      const newY = clamp(
        d.origY + dy,
        headerH + MARGIN,
        window.innerHeight - footerH - ORB_SIZE - MARGIN,
      );
      const next = { x: newX, y: newY };
      posRef.current = next;
      setPos(next);
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      // 长按已触发 → 无需额外操作
      if (isLongPressFired.current) return;
      // 拖动结束 → 位置已由 onPointerMove 实时更新
      if (dragRef.current.moved) {
        if (posRef.current) persist(posRef.current);
        return;
      }
      // 纯单击 → 出错态重试；否则播放/暂停
      if (m.playbackState === "error") m.retry();
      else m.toggle();
    },
    [m, persist],
  );

  if (!item || !pos) return null;

  const progress = m.duration > 0 ? m.currentTime / m.duration : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className="fixed z-[115] select-none"
      aria-label={PLAYER_NAME}
      style={{
        left: pos.x,
        top: pos.y,
        width: ORB_SIZE,
        height: ORB_SIZE,
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title={`${item.title} — ${item.artist}（单击播放/暂停 · 长按展开）`}
    >
      <div className="relative w-full h-full">
        {/* 封面 — 仅在真正 playing 时旋转。
            注意：<img> 是替换元素，absolute + inset 四边不会拉伸它；故用 top/left + 显式 calc 尺寸定位，
            确保封面确定占 (ORB_SIZE-4) 见方、中心 (28,28)，与 SVG 环 (cx/cy=28) 完全同心。
            不用 translate 居中，避免与 animate-spin 的 transform 冲突。 */}
        <CoverImage
          item={item}
          className="absolute top-[2px] left-[2px] w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-full object-cover shadow-lg animate-spin-slow"
          style={{
            animationPlayState:
              m.playbackState === "playing" ? "running" : "paused",
          }}
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

        {/* 中心状态图标：playing 无；loading/buffering 转圈；error 警示（点击重试）；其余显示播放 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {m.playbackState === "playing" ? null : m.playbackState === "loading" ||
            m.playbackState === "buffering" ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          ) : m.playbackState === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Play className="w-4 h-4 text-white drop-shadow-md ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
