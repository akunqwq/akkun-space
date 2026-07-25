import Link from "next/link";
import { Music2 } from "lucide-react";
import { mediaItems } from "@/lib/media";
import MediaCard from "../components/media/MediaCard";
import RecentStrip from "../components/media/RecentStrip";
import GlassPage from "../components/GlassPage";

export const metadata = {
  title: "媒体中心",
  description: "阿鲲の小窝 · 自研 Web 音频引擎，自定义控制栏、倍速、Media Session。",
};

export default function MediaHubPage() {
  return (
    <GlassPage maxWidth="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          媒体中心
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          自研 Web 媒体引擎 · 自定义控制栏、倍速、画中画、全屏、字幕，
          切页面播放不中断，并接入系统媒体控制（Media Session）。
        </p>
      </header>

      {/* 入口 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link
          href="/media/music"
          className="group card hover:shadow-xl transition-all duration-200 flex items-center gap-4 p-5"
        >
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--tag-bg)] text-[var(--tag-text)] shrink-0">
            <Music2 className="w-7 h-7" />
          </span>
          <div>
            <div className="font-bold text-[var(--text-primary)] text-lg">
              音乐馆
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              {mediaItems.length} 首 · 播放列表 / 收藏 / 频谱
            </div>
          </div>
        </Link>
      </div>

      {/* 最近播放（客户端历史） */}
      <RecentStrip />

      {/* 音乐 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">音乐</h2>
          <Link
            href="/media/music"
            className="text-sm text-accent hover:underline"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item, i) => (
            <MediaCard key={item.id} item={item} items={mediaItems} index={i} />
          ))}
        </div>
      </section>
    </GlassPage>
  );
}
