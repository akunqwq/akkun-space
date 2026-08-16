"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Play, Pause, Minimize2 } from "lucide-react";
import { useMusic } from "./MusicProvider";
import CoverImage from "./CoverImage";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import MusicBubble from "./MusicBubble";
import { formatTime } from "./utils";
import { PLAYER_NAME } from "./types";

const iconBtn =
  "flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-secondary)] hover:text-accent hover:bg-[var(--theme-toggle-hover)] transition-colors shrink-0 cursor-pointer";

// 可拖拽的纵向边界：header 下沿 ~ footer 上沿之间
function getVerticalBounds(h: number) {
  const headerH =
    document.querySelector("header")?.getBoundingClientRect().height ?? 0;
  const footerH =
    document.querySelector("footer")?.getBoundingClientRect().height ?? 0;
  const minTop = headerH + 8;
  const maxTop = Math.max(minTop, window.innerHeight - footerH - h - 8);
  return { minTop, maxTop };
}

// 常驻迷你播放器：底部固定一条播放栏，切页面不中断。
// 桌面歌词风：整条可拖（避开按钮/进度/音量），文本不可选中；可「收起」为可拖拽悬浮窗。
export default function MusicBar() {
  const m = useMusic();

  // ⚠️ 所有 Hooks 必须在任何 return 之前调用（Rules of Hooks）
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
    moved: boolean;
  } | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // 客户端计算默认位置；优先读取已保存位置。
  // 依赖加入 currentItem / minimized：bar 真正出现在视口时才（重新）计算并 setPos，
  // 否则 bar 首次挂载时 barRef 为 null、pos 永远为 null，导致 onPointerDown 早退、无法拖动。
  useEffect(() => {
    if (pos || !barRef.current) return;
    const el = barRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let saved: { left: number; top: number } | null = null;
    try {
      const raw = localStorage.getItem("music-bar-position");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.left === "number" && typeof p.top === "number") saved = p;
      }
    } catch {
      saved = null;
    }
    const { minTop, maxTop } = getVerticalBounds(h);
    const defTop =
      (document.querySelector("header")?.getBoundingClientRect().height ?? 64) +
      16;
    setPos(
      saved ?? {
        left: (window.innerWidth - w) / 2,
        top: Math.min(Math.max(minTop, defTop), maxTop),
      }
    );
  }, [pos, m.currentItem, m.minimized]);

  // 窗口尺寸变化：把已存/已拖的位置重新夹紧在 header~footer 区间内
  useEffect(() => {
    const onResize = () => {
      setPos((p) => {
        if (!p || !barRef.current) return p;
        const w = barRef.current.offsetWidth;
        const h = barRef.current.offsetHeight;
        const { minTop, maxTop } = getVerticalBounds(h);
        return {
          left: Math.min(Math.max(8, p.left), window.innerWidth - w - 8),
          top: Math.min(Math.max(minTop, p.top), maxTop),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // —— Hooks 之后才允许条件早退 ——
  if (!m.currentItem) return null;
  if (m.minimized) return <MusicBubble />;
  const item = m.currentItem;

  // 时间区文案：按精确播放状态区分，避免「00:00/00:00」假象
  const ps = m.playbackState;
  const isError = ps === "error";
  const ready = m.duration > 0 && ps !== "loading" && ps !== "buffering";
  const timeLabel = isError
    ? "播放失败，点击重试"
    : ps === "loading"
      ? "资源加载中…"
      : ps === "buffering"
        ? "正在缓冲中…"
        : ready
          ? `${formatTime(m.currentTime)} / ${formatTime(m.duration)}`
          : "--:-- / --:--";

  const onPointerDown = (e: React.PointerEvent) => {
    // 交互元素（按钮 / 进度 / 音量等）不触发整条拖拽
    if ((e.target as HTMLElement).closest("button, input, a, [data-no-drag]"))
      return;
    // 阻止原生图片拖拽 / 文本选择，保证自定义拖拽生效（与悬浮球一致）
    e.preventDefault();
    if (!barRef.current || !pos) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: pos.left,
      origTop: pos.top,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const d = dragRef.current;
    if (!d || !barRef.current) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 4) return; // 阈值内视为点击
    d.moved = true;
    setDragging(true);
    const el = barRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const { minTop, maxTop } = getVerticalBounds(h);
    const left = Math.min(
      Math.max(8, d.origLeft + dx),
      window.innerWidth - w - 8
    );
    // 纵向限定在 header 下沿 ~ footer 上沿之间
    const top = Math.min(
      Math.max(minTop, d.origTop + dy),
      maxTop
    );
    setPos({ left, top });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!d?.moved) return;
    setDragging(false);
    setPos((p) => {
      if (p) localStorage.setItem("music-bar-position", JSON.stringify(p));
      return p;
    });
  };

  const posStyle: CSSProperties = pos
    ? { left: pos.left, top: pos.top, touchAction: "none" }
    : { left: "50%", bottom: 16, transform: "translateX(-50%)", touchAction: "none" };

  // 播放条接近顶部（header 下方）时，音量弹出向下展开，避免越界或遮挡
  const flipVolumeDown = pos ? pos.top < 150 : false;

  return (
    <div
      ref={barRef}
      aria-label={PLAYER_NAME}
      style={posStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`fixed z-[115] w-[min(calc(100vw-5rem),44rem)] select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div className="card">
        {/* 进度条（可点按/拖拽，已排除整条拖拽） */}
        <div className="px-3 pt-2.5">
          <ProgressBar />
        </div>

        {/* 控制行 */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 pb-2.5">
          {/* 封面 */}
          <CoverImage
            item={item}
            className="w-12 h-12 rounded-lg object-cover shrink-0 shadow"
          />

          {/* 标题 / 艺术家（不可选中） */}
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium text-[var(--text-primary)]">
              {item.title}
            </div>
            <div className="truncate text-xs text-[var(--text-secondary)]">
              {item.artist}
              <span
                className={`ml-2 font-mono text-[10px] tabular-nums text-[var(--text-muted)] ${isError ? "cursor-pointer hover:text-accent underline underline-offset-2" : ""}`}
                onClick={isError ? () => m.retry() : undefined}
                title={isError ? "点击重试" : undefined}
              >
                {timeLabel}
              </span>
            </div>
          </div>

          {/* 控制按钮（照常可点） */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--btn-primary)] text-white hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer"
              onClick={m.toggle}
              title={m.isPlaying ? "暂停" : "播放"}
            >
              {m.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <VolumeControl flipDown={flipVolumeDown} />
            <button
              className={`${iconBtn} hidden sm:flex font-mono text-xs w-auto px-2`}
              onClick={m.cycleRate}
              title="播放速度"
            >
              {m.rate}x
            </button>
            <button
              className={iconBtn}
              onClick={m.toggleMinimize}
              title="收起为悬浮窗"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
