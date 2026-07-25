"use client";

import { useMedia } from "./MediaProvider";
import MediaCard from "./MediaCard";

// 最近播放：读取客户端播放历史（跨路由保存在 MediaProvider 内）
export default function RecentStrip() {
  const m = useMedia();
  if (m.history.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">
        最近播放
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {m.history.slice(0, 8).map((item, i) => (
          <MediaCard
            key={`recent-${item.id}-${i}`}
            item={item}
            items={m.history}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
