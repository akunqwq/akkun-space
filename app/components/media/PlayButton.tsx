"use client";

import { Play } from "lucide-react";
import type { MediaItem } from "@/lib/media";
import { useMedia } from "./MediaProvider";

// 详情页 / 列表页触发播放的按钮
export default function PlayButton({
  item,
  items,
  index = 0,
  label = "播放",
}: {
  item: MediaItem;
  items: MediaItem[];
  index?: number;
  label?: string;
}) {
  const m = useMedia();
  return (
    <button
      onClick={() => m.playQueue(items, index)}
      className="inline-flex items-center gap-2 rounded-full bg-[var(--btn-primary)] text-white px-5 py-2.5 font-medium hover:bg-[var(--btn-primary-hover)] transition-colors shadow-lg hover:shadow-xl"
    >
      <Play className="w-5 h-5" />
      {label}
    </button>
  );
}
