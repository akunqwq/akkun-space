// app/components/tools/VideoStatQuery.tsx
// -----------------------------------------------------------------------------
// 视频统计查询内嵌组件（Client Component）
// 输入 BV 号 → 调 /api/bili/video-stat → 展示播放/弹幕/收藏等统计
// 阿鲲 Q6：放 UP 主详情页底部内嵌，不独立成页
// -----------------------------------------------------------------------------
'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import type { BiliVideoStat } from '@/lib/bili/types';

interface ApiResponse {
  code: number;
  data?: BiliVideoStat;
  degraded?: boolean;
  message?: string;
}

export default function VideoStatQuery() {
  const [bvid, setBvid] = useState('');
  const [stat, setStat] = useState<BiliVideoStat | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = useCallback(async () => {
    const trimmed = bvid.trim();
    if (!trimmed) {
      setError('请输入 BV 号');
      return;
    }
    if (!/^BV[a-zA-Z0-9]{8,}$/.test(trimmed)) {
      setError('BV 号格式无效（如 BV1xx411x7xx）');
      return;
    }
    setError(null);
    setLoading(true);
    setStat(null);
    setDegraded(false);

    try {
      const resp = await fetch(`/api/bili/video-stat?bvid=${encodeURIComponent(trimmed)}`);
      const json: ApiResponse = await resp.json();
      if (json.code !== 0 || !json.data) {
        setError(json.message ?? '查询失败');
        return;
      }
      setStat(json.data);
      setDegraded(json.degraded ?? false);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [bvid]);

  const formatNum = (n: number): string => {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
    if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
    return String(n);
  };

  return (
    <div className="mt-8 rounded-2xl border border-[var(--border,#e5e7eb)] bg-[var(--bg-secondary,#f9fafb)]/50 p-5">
      <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
        视频统计查询
      </h3>
      <p className="mb-3 text-sm text-[var(--text-secondary,#9ca3af)]">
        输入 BV 号查询单条视频的播放/弹幕/收藏等统计
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          value={bvid}
          onChange={(e) => {
            setBvid(e.target.value);
            if (error) setError(null);
          }}
          placeholder="如 BV1xx411x7xx"
          className="flex-1 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] caret-[var(--bili-blue)] outline-none transition-all duration-200 focus:border-[var(--bili-blue)] focus:ring-2 focus:ring-[var(--bili-blue-ring)] focus:shadow-[0_0_14px_var(--bili-blue-glow)]"
          aria-label="BV 号输入框"
        />
        <button
          type="button"
          onClick={handleQuery}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-[var(--bili-blue)] px-5 py-2.5 font-medium text-white transition-all duration-200 hover:bg-[var(--bili-pink)] hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>查</span>
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {degraded && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          数据可能延迟（B 站接口降级，返回的是缓存数据）
        </p>
      )}

      {stat && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: '播放', value: stat.view },
            { label: '弹幕', value: stat.danmaku },
            { label: '评论', value: stat.reply },
            { label: '收藏', value: stat.favorite },
            { label: '投币', value: stat.coin },
            { label: '分享', value: stat.share },
            { label: '点赞', value: stat.like },
            { label: '当前排名', value: stat.now_rank },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white/60 dark:bg-black/20 px-3 py-2 text-center"
            >
              <div className="text-lg font-bold text-[var(--accent)]">
                {formatNum(item.value)}
              </div>
              <div className="text-xs text-[var(--text-secondary,#9ca3af)]">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
