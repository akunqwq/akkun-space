"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Comment {
  id: number;
  user_name: string;
  avatar: string;
  date: string;
  text: string;
  created_at?: string;
}

function timeAgo(dateString: string) {
  try {
    const d = new Date(dateString).getTime();
    const now = Date.now();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    return diff === 0 ? "今天" : `${diff} 天前`;
  } catch (error) {
    return "未知时间";
  }
}

export default function RecentComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ user_name: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // 指数退避

  // 从 Supabase 加载评论（带重试）
  useEffect(() => {
    fetchComments(0);
  }, []);

  const fetchComments = async (attempt: number) => {
    try {
      setError(null);
      if (attempt === 0) setIsLoading(true);

      // 8s 超时保护，避免请求挂死
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('/api/guestbook', {
        cache: 'no-store',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          /* 忽略解析失败，沿用默认 msg */
        }
        throw new Error(msg);
      }

      const json = await res.json();
      setComments(json.comments || []);
      setHasLoadedOnce(true);
      setRetryCount(0);
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : '未知错误';
      // 网络层错误（浏览器 → 同源 Next 服务）一律可重试
      const isNetworkErr =
        err instanceof TypeError ||
        (err instanceof Error && err.name === 'AbortError') ||
        /Failed to fetch|abort|network|HTTP 5/i.test(rawMsg);

      if (attempt < MAX_RETRIES) {
        // 自动重试（指数退避）
        setRetryCount(attempt + 1);
        setTimeout(() => fetchComments(attempt + 1), RETRY_DELAYS[attempt]);
      } else {
        // 重试耗尽：网络类给友好提示，业务类透传服务端报错
        setError(
          isNetworkErr
            ? '网络异常，请检查连接后点击重试'
            : rawMsg
        );
        setRetryCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ESC键关闭弹窗
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showForm) {
        setShowForm(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.user_name.trim() || !newComment.text.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: newComment.user_name.trim(),
          text: newComment.text.trim(),
        }),
      });

      if (!res.ok) {
        let msg = `提交失败 (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          /* 忽略解析失败 */
        }
        throw new Error(msg);
      }

      const json = await res.json();
      const newItem = json.comment;
      if (newItem) {
        // 更新本地状态：新留言置顶
        setComments([newItem, ...comments]);
      }

      // 重置表单
      setNewComment({ user_name: '', text: '' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交评论出错');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 桌面端居中表单 */}
      {showForm && (
        <div
          className="hidden md:flex fixed inset-0 bg-black/50 items-center justify-center z-[90]"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-[var(--card-bg)] rounded-2xl p-8 w-full max-w-lg mx-4 shadow-xl border border-[var(--border-color)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">写留言</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="你的昵称"
                value={newComment.user_name}
                onChange={(e) => setNewComment({...newComment, user_name: e.target.value})}
                className="w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-accent/50 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-accent"
                required
                title="你的昵称"
              />
              <textarea
                placeholder="写下你的留言..."
                value={newComment.text}
                onChange={(e) => setNewComment({...newComment, text: e.target.value})}
                className="w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-accent/50 h-32 resize-none bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-accent"
                required
                title="留下你宝贵的意见~"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[var(--btn-primary)] text-white py-3 rounded-lg text-base font-medium hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '提交中...' : '提交留言'}
              </button>
            </form>
          </div>
        </div>
      )}

      <aside
        className={`
          bg-[var(--card-bg)] backdrop-blur-md
          p-3 md:p-6 rounded-3xl
          w-56 md:w-80
          fixed bottom-28 md:bottom-34
          ${isCollapsed ? '-left-48 md:left-4 md:right-8 md:left-auto' : 'left-4 md:left-8 md:right-8 md:left-auto'}
          z-[60]
          hover:shadow-lg
          transition-all duration-300
          border border-[var(--border-color)]
        `}
      >
        {/* 移动端收起按钮 - 在右侧 */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="md:hidden absolute -right-2 top-1/2 -translate-y-1/2 bg-[var(--card-bg)] backdrop-blur-sm rounded-full p-1 shadow-md hover:bg-[var(--card-bg-hover)] transition-colors border border-[var(--border-color)]"
          title={isCollapsed ? "展开留言板" : "收起留言板"}
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base md:text-lg font-bold text-center text-[var(--text-primary)]">留言板</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`${isCollapsed ? 'md:inline hidden' : ''} text-accent hover:text-[var(--accent-hover)] text-xs md:text-sm font-medium`}
          >
            {showForm ? '取消' : '写留言'}
          </button>
        </div>

        {/* 移动端表单 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-3 bg-[var(--card-bg)] rounded-lg space-y-3 md:hidden border border-[var(--border-color)]">
            <input
              type="text"
              placeholder="你的昵称"
              value={newComment.user_name}
              onChange={(e) => setNewComment({...newComment, user_name: e.target.value})}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              required
              title="你的昵称"
            />
            <textarea
              placeholder="写下你的留言..."
              value={newComment.text}
              onChange={(e) => setNewComment({...newComment, text: e.target.value})}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 h-20 resize-none bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              required
              title="留下你宝贵的意见~"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--btn-primary)] text-white py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--btn-primary-hover)]"
            >
              {isSubmitting ? '提交中...' : '提交留言'}
            </button>
          </form>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg text-[var(--error-text)] text-sm">
            <p className="break-all">{error}</p>
            <button
              onClick={() => fetchComments(0)}
              className="mt-2 px-3 py-1 text-xs rounded-md bg-[var(--error-border)] hover:opacity-80 transition-opacity"
            >
              重试
            </button>
          </div>
        )}

        {/* 重试中提示 */}
        {retryCount > 0 && !error && (
          <div className="mb-4 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-muted)] text-sm text-center">
            正在重试加载... ({retryCount}/{MAX_RETRIES})
          </div>
        )}

        {/* 评论列表 */}
        <div className="space-y-3 md:space-y-5 max-h-80 md:max-h-96 overflow-y-auto">
          {isLoading ? (
            // 骨架屏，根据实际情况调整数量
            <>
              {(() => {
                // 首次加载显示1个，后续加载显示当前评论数量或最多3个
                const skeletonCount = hasLoadedOnce ? Math.min(comments.length || 1, 3) : 1;
                return Array.from({ length: skeletonCount }, (_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--border-color)] animate-pulse"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="h-4 bg-[var(--border-color)] rounded w-20 animate-pulse"></div>
                        <div className="h-3 bg-[var(--border-color)] rounded w-12 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-[var(--border-color)] rounded w-full mb-1 animate-pulse"></div>
                      <div className="h-3 bg-[var(--border-color)] rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ));
              })()}
            </>
          ) : comments.length === 0 ? (
            <div className="text-center text-[var(--text-muted)] text-sm py-8">
              <span className="md:inline hidden">暂无留言，快留下宝贵的意见反馈吧！</span>
              <span className="md:hidden">暂无留言</span>
            </div>
          ) : (
            <>
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  {/* 头像 */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {c.avatar ? (
                      <Image
                        src={c.avatar}
                        width={40}
                        height={40}
                        alt={c.user_name}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] text-sm font-medium">
                        {c.user_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* 内容区域 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--text-secondary)] flex justify-between">
                      <span className="font-medium">{c.user_name}</span>
                      <span className="text-[var(--text-muted)]">{timeAgo(c.date)}</span>
                    </div>

                    <p className="text-[var(--text-primary)] text-sm mt-1 line-clamp-2">
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </aside>
    </>
  );
}