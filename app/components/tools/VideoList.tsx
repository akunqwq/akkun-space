import { AlertTriangle } from 'lucide-react';

import type { BiliVideoItem, VideoStatus } from '@/lib/bili/types';

export default function VideoList({
  videos,
  status,
}: {
  videos: BiliVideoItem[];
  status: VideoStatus;
}) {
  if (videos.length === 0) {
    // 明确区分：被风控拦截（拿不到任何数据）vs 真的没视频
    if (status === 'unavailable') {
      return (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          投稿列表暂时受到 B 站风控限制，视频无法展示，请稍后重试。
        </p>
      );
    }
    return <p className="text-sm text-[var(--text-muted)]">暂无视频数据</p>;
  }

  return (
    <div>
      {status === 'stale' && (
        <p className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          投稿列表为缓存数据，可能略有延迟。
        </p>
      )}
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
    </div>
  );
}
