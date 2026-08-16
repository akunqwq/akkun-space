import { musicItems } from "@/lib/music";
import MusicCard from "../components/music/MusicCard";
import GlassPage from "../components/GlassPage";

export const metadata = {
  title: "音乐库",
  description: "阿鲲の小窝 - 音乐库",
};

export default function MusicPage() {
  return (
    <GlassPage maxWidth="max-w-[1400px]">
      <header className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          音乐库
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          从以下四首测试曲目选一首喜欢的点击播放吧！
        </p>
        <p className="mt-2 text-[var(--text-secondary)]">
          注明：仅供开发测试使用
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {musicItems.map((item, i) => (
          <MusicCard key={item.id} item={item} items={musicItems} index={i} />
        ))}
      </div>
    </GlassPage>
  );
}
