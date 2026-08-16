"use client";

import { Volume2, Volume1, VolumeX } from "lucide-react";
import { useMusic } from "./MusicProvider";
import type { CSSProperties } from "react";

// 竖向 Slider：writing-mode 把原生 range 转为竖向，direction:rtl 使顶部=最大音量
const verticalSlider: CSSProperties = {
  writingMode: "vertical-lr",
  direction: "rtl",
};

export default function VolumeControl({ flipDown = false }: { flipDown?: boolean }) {
  const m = useMusic();
  const Icon =
    m.muted || m.volume === 0 ? VolumeX : m.volume < 0.5 ? Volume1 : Volume2;
  const pct = Math.round((m.muted ? 0 : m.volume) * 100);

  // 播放条在顶部附近时向下展开，避免超出屏幕或被 header 遮挡；否则向上展开
  const popupPos = flipDown ? "top-full pt-3" : "bottom-full pb-3";

  return (
    <div className="group relative flex items-center">
      <button
        className="flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-secondary)] hover:text-accent hover:bg-[var(--theme-toggle-hover)] transition-colors"
        onClick={m.toggleMute}
        title={m.muted ? "取消静音" : "静音"}
      >
        <Icon className="w-5 h-5" />
      </button>

      {/* Hover 弹出竖向音量条：移入图标显示，移出自动隐藏；点击图标切静音 */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center ${popupPos}`}
      >
        <div className="card rounded-2xl px-2.5 py-3 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums text-[var(--text-muted)]">
            {pct}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={m.muted ? 0 : m.volume}
            onChange={(e) => m.setVolume(Number(e.target.value))}
            style={verticalSlider}
            className="h-24 w-1.5 accent-[var(--accent)] cursor-pointer"
            title="音量"
            aria-label="音量"
          />
        </div>
      </div>
    </div>
  );
}
