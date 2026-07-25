import { mediaItems } from "@/lib/media";
import MediaCard from "../../components/media/MediaCard";
import GlassPage from "../../components/GlassPage";

export const metadata = {
  title: "音乐馆",
  description: "阿鲲の小窝 · 自研音频播放器，自定义控制栏、倍速、Media Session。",
};

export default function MusicPage() {
  return (
    <GlassPage maxWidth="max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          音乐馆
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          选一首你想听的音乐即可播放，播放器会在本站常驻，切页面也不中断。
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaItems.map((item, i) => (
          <MediaCard key={item.id} item={item} items={mediaItems} index={i} />
        ))}
      </div>
    </GlassPage>
  );
}
