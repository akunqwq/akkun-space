import type { BiliVideoItem } from '@/lib/bili/types';

export default function VideoList({ videos }: { videos: BiliVideoItem[] }) {
  if (!videos.length) {
    return <p className="text-sm text-[var(--text-muted)]">暂无视频数据</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <a
          key={v.bvid}
          href={`https://www.bilibili.com/video/${v.bvid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] transition hover:border-[var(--accent)]/50"
        >
          <div className="aspect-video overflow-hidden bg-black/10">
            <img
              src={v.pic.startsWith('//') ? `https:${v.pic}` : v.pic}
              alt={v.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-3">
            <h4 className="line-clamp-2 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
              {v.title}
            </h4>
            <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
              <span>播放 {v.play.toLocaleString()}</span>
              <span>{new Date(v.created * 1000).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
