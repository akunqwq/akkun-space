"use client";

import { X, Music2 } from "lucide-react";
import { useMedia } from "./MediaProvider";
import CoverImage from "./CoverImage";
import { formatTime } from "./utils";

export default function Playlist() {
  const m = useMedia();
  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-[201] bg-black/40"
        onClick={m.togglePlaylist}
      />
      {/* 右侧抽屉 */}
      <div className="fixed top-0 right-0 z-[202] h-full w-[min(90vw,22rem)] border-l border-[var(--border-color)] bg-[var(--card-bg)] shadow-2xl flex flex-col animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <span className="font-bold text-[var(--text-primary)]">
            播放列表 ({m.queue.length})
          </span>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-accent hover:bg-[var(--theme-toggle-hover)] transition-colors"
            onClick={m.togglePlaylist}
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {m.queue.map((item, i) => {
            const active = i === m.currentIndex;
            return (
              <button
                key={item.id}
                onClick={() => m.playQueue(m.queue, i)}
                className={`w-full flex items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                  active
                    ? "bg-[var(--btn-primary)]/15"
                    : "hover:bg-[var(--theme-toggle-hover)]"
                }`}
              >
                <CoverImage
                  item={item}
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-sm ${
                      active
                        ? "text-accent font-medium"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="truncate text-xs text-[var(--text-secondary)]">
                    {item.artist}
                  </div>
                </div>
                <Music2 className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
                {item.duration ? (
                  <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-muted)]">
                    {formatTime(item.duration)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
