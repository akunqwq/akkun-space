"use client";

import { Play, Music2 } from "lucide-react";
import type { MediaItem } from "@/lib/media";
import { useMedia } from "./MediaProvider";
import CoverImage from "./CoverImage";
import { formatTime } from "./utils";

export default function MediaCard({
  item,
  items,
  index,
}: {
  item: MediaItem;
  items: MediaItem[];
  index: number;
}) {
  const m = useMedia();

  const onPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    m.playQueue(items, index);
  };

  return (
    <div className="group card hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col">
      {/* 封面 */}
      <button
        onClick={onPlay}
        className="relative block w-full aspect-video overflow-hidden bg-[var(--theme-toggle-hover)]"
        title={`播放 ${item.title}`}
      >
        <CoverImage
          item={item}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--btn-primary)] text-white shadow-lg">
            <Play className="w-7 h-7" />
          </span>
        </span>
        {item.duration ? (
          <span className="absolute bottom-1.5 right-1.5 font-mono text-[10px] tabular-nums text-white bg-black/60 px-1.5 py-0.5 rounded">
            {formatTime(item.duration)}
          </span>
        ) : null}
        <span className="absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] text-white bg-black/55 px-1.5 py-0.5 rounded">
          <Music2 className="w-3 h-3" />
          音频
        </span>
      </button>

      {/* 信息 */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="font-medium text-[var(--text-primary)] truncate">
          {item.title}
        </div>
        <div className="text-xs text-[var(--text-secondary)] truncate">
          {item.artist}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--tag-bg)] text-[var(--tag-text)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
