"use client";

import { useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Maximize2, ChevronsDownUp, X } from "lucide-react";
import { useMedia } from "./MediaProvider";
import CoverImage from "./CoverImage";
import { formatTime } from "./utils";
import { classifyDock, snapX } from "@/lib/media-player-storage";

const CARD_W = 340;
const CARD_H = 72;
const MARGIN = 12;

/**
 * MiniPlayer — 可拖动浮动小卡片 + 边缘吸附
 * - 点击封面图 → expanded
 * - 拖动卡片非按钮非封面区域 → 移动位置，松手吸附
 * - ChevronsDownUp → bubble
 */
export default function MiniPlayer() {
  const m = useMedia();
  if (m.mode !== "mini" || !m.currentItem) return null;

  const item = m.currentItem;
  const pct = m.duration ? (m.currentTime / m.duration) * 100 : 0;

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  const posRef = useRef(m.floating.mini);
  posRef.current = m.floating.mini;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // 按钮 & 封面区域 → 不启动拖动（由各自的 onClick 处理）
    const target = e.target as HTMLElement;
    if (target.closest("button, [data-mini-cover]")) return;

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
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const d = dragRef.current;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.moved) {
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    }

    const newX = Math.max(MARGIN, Math.min(window.innerWidth - CARD_W - MARGIN, d.origX + dx));
    const newY = Math.max(MARGIN, Math.min(window.innerHeight - CARD_H - MARGIN, d.origY + dy));
    m.setMiniPos(newX, newY, posRef.current.dock);
  }, [m]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);

      if (!dragRef.current.moved) return; // 单击非封面区域，无操作

      // 拖动结束 → 三区吸附
      const pos = posRef.current;
      const cardCenter = pos.x + CARD_W / 2;
      const dock = classifyDock(cardCenter, window.innerWidth);
      const snappedX = snapX(dock, CARD_W, window.innerWidth);
      m.setMiniPos(snappedX, pos.y, dock);
    },
    [m],
  );

  const onBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const r = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    m.seek(r * (m.duration || 0));
  };

  return (
    <div
      className="fixed z-[120] select-none"
      style={{
        left: m.floating.mini.x,
        top: m.floating.mini.y,
        width: CARD_W,
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--player-bg)]/95 backdrop-blur-md shadow-xl px-3 py-2.5 cursor-pointer">
        {/* 封面 — 点击展开 */}
        <CoverImage
          item={item}
          data-mini-cover
          className="w-12 h-12 rounded-lg object-cover shrink-0 shadow cursor-pointer ring-2 ring-transparent hover:ring-[var(--btn-primary)] transition-all"
          onClick={() => m.setMode("expanded")}
        />

        {/* 信息 + 进度 */}
        <div className="flex-1 min-w-0 pointer-events-none">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                {item.title}
              </div>
              <div className="truncate text-xs text-[var(--text-secondary)]">
                {item.artist}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--text-muted)]">
              {formatTime(m.currentTime)} / {formatTime(m.duration)}
            </span>
          </div>

          {/* 进度条 */}
          <div
            className="mt-1.5 h-1 rounded-full bg-[var(--border-color)] relative overflow-hidden pointer-events-auto"
            onClick={onBarClick}
            title="点击跳转"
          >
            <div
              className="absolute left-0 top-0 h-full bg-[var(--btn-primary)] rounded-full transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-accent hover:bg-[var(--theme-toggle-hover)] transition-colors"
            onClick={(e) => { e.stopPropagation(); m.prev(); }}
            title="上一首"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--btn-primary)] text-white hover:bg-[var(--btn-primary-hover)] transition-colors"
            onClick={(e) => { e.stopPropagation(); m.toggle(); }}
            title={m.isPlaying ? "暂停" : "播放"}
          >
            {m.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-accent hover:bg-[var(--theme-toggle-hover)] transition-colors"
            onClick={(e) => { e.stopPropagation(); m.next(); }}
            title="下一首"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-accent hover:bg-[var(--theme-toggle-hover)] transition-colors"
            onClick={(e) => { e.stopPropagation(); m.setMode("expanded"); }}
            title="展开"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-accent hover:bg-[var(--theme-toggle-hover)] transition-colors"
            onClick={(e) => { e.stopPropagation(); m.setMode("bubble"); }}
            title="缩为悬浮球"
          >
            <ChevronsDownUp className="w-4 h-4" />
          </button>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--theme-toggle-hover)] transition-colors"
            onClick={(e) => { e.stopPropagation(); m.pause(); m.setMode("hidden"); }}
            title="停止并关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
