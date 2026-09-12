// app/components/tools/UpSearchBox.tsx
// -----------------------------------------------------------------------------
// UP 主 mid 搜索输入框组件（Client Component）
// 输入 mid → 跳转 /tools/bili-up/{mid} 详情页
// 增强：focus 外发光、bili 蓝光标、快捷示例 Tag、按钮 ready 态微交互
// -----------------------------------------------------------------------------
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './biliTools.module.css';
import { Search, Loader2 } from 'lucide-react';

// 热门 / 测试 UID 快捷示例：降低初次体验输入门槛，点击直接跳详情页
// ⚠️ UID 已用公开来源核对（2026-09-08 修复：原 11210/208259/946974 全部串号）：
//   老番茄=546195、影视飓风=946974、何同学=163637592、罗翔说刑法=517327498
const QUICK_SEEDS = [
  { mid: '546195', name: '老番茄' },
  { mid: '946974', name: '影视飓风' },
  { mid: '163637592', name: '何同学' },
  { mid: '517327498', name: '罗翔说刑法' },
];

export default function UpSearchBox() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goToMid = useCallback(
    (mid: string) => {
      setError(null);
      setLoading(true);
      router.push(`/tools/bili-up/${mid}`);
    },
    [router],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) {
        setError('请输入 UP 主 mid');
        return;
      }
      const mid = Number(trimmed);
      if (!Number.isFinite(mid) || mid <= 0 || !/^\d+$/.test(trimmed)) {
        setError('mid 须为正整数（UP 主主页 URL 末尾数字）');
        return;
      }
      goToMid(trimmed);
    },
    [input, goToMid],
  );

  const ready = input.trim().length > 0 && !loading;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={input}
            onChange={(e) => {
              // 输入即去除所有空白（前导/尾随/误粘贴的内部空格），UID 为纯数字故无副作用
              setInput(e.target.value.replace(/\s+/g, ''));
              if (error) setError(null);
            }}
            placeholder="输入 UP 主 mid（如 12345）"
            aria-label="UP 主 mid 输入框"
            className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] caret-[var(--bili-blue)] outline-none transition-all duration-200 focus:border-[var(--bili-blue)] focus:ring-2 focus:ring-[var(--bili-blue-ring)] focus:shadow-[0_0_18px_var(--bili-blue-glow)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 ${
              ready
                ? `${styles.biliGradient} shadow-[0_4px_20px_var(--bili-blue-glow)]`
                : 'bg-[var(--bili-blue)]'
            }`}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          <span>查询</span>
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">示例:</span>
        {QUICK_SEEDS.map((s) => (
          <button
            key={s.mid}
            type="button"
            disabled={loading}
            onClick={() => goToMid(s.mid)}
            title={`mid ${s.mid}`}
            className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--bili-blue-soft)] bg-[var(--card-bg-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--bili-pink)] hover:text-[var(--text-primary)] hover:shadow-[0_2px_12px_var(--bili-pink-soft)] disabled:opacity-50"
          >
            <span>{s.name}</span>
            <span className="font-mono opacity-50 transition-opacity group-hover:opacity-80">
              {s.mid}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-[var(--text-secondary)]">
        提示：mid 在 UP 主主页 URL 末尾（space.bilibili.com/xxxx 中的 xxxx）
      </p>
    </div>
  );
}
