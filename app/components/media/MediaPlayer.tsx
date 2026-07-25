"use client";

import { useRef } from "react";
import { X, Maximize } from "lucide-react";
import { useMedia } from "./MediaProvider";
import Controls from "./Controls";
import CoverImage from "./CoverImage";

/**
 * MediaPlayer — 音频展开视图（卡片式，非全屏影院）
 */
export default function MediaPlayer() {
  const m = useMedia();
  const item = m.currentItem;
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (m.mode !== "expanded" || !item) return null;

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await wrapperRef.current?.requestFullscreen();
    } catch { /* ignore */ }
  };

  return (
    <div
      className="fixed inset-0 z-[201] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        // 点击遮罩层关闭
        if (e.target === e.currentTarget) m.setMode("mini");
      }}
    >
      {/* ===== 卡片 ===== */}
      <div
        ref={wrapperRef}
        className="relative w-[min(92vw,400px)] max-h-[92vh] overflow-y-auto rounded-3xl bg-[#1a1a2e]/95 shadow-2xl border border-white/10 p-5 flex flex-col gap-4"
      >
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">正在播放 · 音频</span>
          <div className="flex items-center gap-1">
            <button
              className="flex items-center justify-center w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              onClick={toggleFullscreen}
              title="浏览器全屏"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => m.setMode("mini")}
              title="收起"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 封面 */}
        <div className="flex justify-center">
          <CoverImage
            item={item}
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-xl"
          />
        </div>

        {/* 标题 & 艺术家 */}
        <div className="text-center px-2">
          <div className="text-lg font-bold text-white truncate">
            {item.title}
          </div>
          <div className="text-sm text-white/50 mt-0.5 truncate">
            {item.artist}
          </div>
        </div>

        {/* 控件（进度、按钮、音量） */}
        <Controls />
      </div>
    </div>
  );
}
