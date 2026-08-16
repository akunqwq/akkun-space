"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { markGuestbookAsRead } from "./GuestbookNotifier";

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

  // —— 留言板悬浮按钮：可拖拽 / 贴边吸附 / localStorage 持久化 ——
  const FAB_KEY = 'guestbook-fab-position';
  const FAB_MARGIN = 16;
  const HEADER_GAP = 12;
  const FOOTER_GAP = 12;

  const btnRef = useRef<HTMLButtonElement>(null);
  const [fab, setFab] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const fabPendingRef = useRef(false);
  const fabSuppressClickRef = useRef(false);
  const startRef = useRef({ px: 0, py: 0, x: 0, y: 0 });

  // —— 留言板展开面板：可拖拽 / 边界限制 / localStorage 持久化 ——
  const PANEL_KEY = 'guestbook-panel-position';
  const PANEL_MARGIN = 8;
  const panelRef = useRef<HTMLElement>(null);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const [panelDragging, setPanelDragging] = useState(false);
  const [panelInitialized, setPanelInitialized] = useState(false);
  const panelDraggingRef = useRef(false);
  const panelPendingRef = useRef(false);
  const panelSuppressClickRef = useRef(false);
  const panelStartRef = useRef({ px: 0, py: 0, x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  // 计算可视区域内允许的拖拽边界（避开 Header 与 Footer 固定区）
  const clampFab = (x: number, y: number) => {
    const el = btnRef.current;
    const W = el?.offsetWidth ?? 56;
    const H = el?.offsetHeight ?? 56;
    const headerH = (document.querySelector('header')?.getBoundingClientRect().height ?? 64) + HEADER_GAP;
    const footerH = (document.querySelector('footer')?.getBoundingClientRect().height ?? 60) + FOOTER_GAP;
    const maxX = window.innerWidth - W - FAB_MARGIN;
    const maxY = window.innerHeight - H - footerH - FAB_MARGIN;
    return {
      x: Math.min(Math.max(x, FAB_MARGIN), Math.max(FAB_MARGIN, maxX)),
      y: Math.min(Math.max(y, headerH), Math.max(headerH, maxY)),
    };
  };

  // 首次进入：读 localStorage，无则用默认右下角
  useEffect(() => {
    let p: { x: number; y: number } | null = null;
    try {
      const raw = localStorage.getItem(FAB_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (typeof o?.x === 'number' && typeof o?.y === 'number') p = { x: o.x, y: o.y };
      }
    } catch { /* ignore */ }
    if (!p) {
      const footerH = (document.querySelector('footer')?.getBoundingClientRect().height ?? 60) + FOOTER_GAP;
      p = { x: window.innerWidth - 56 - FAB_MARGIN, y: window.innerHeight - 56 - footerH - FAB_MARGIN };
    }
    setFab(clampFab(p.x, p.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 视口尺寸变化时重新夹紧并持久化
  useEffect(() => {
    const onResize = () => {
      setFab((prev) => {
        if (!prev) return prev;
        const c = clampFab(prev.x, prev.y);
        try { localStorage.setItem(FAB_KEY, JSON.stringify(c)); } catch { /* ignore */ }
        return c;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!fab || !btnRef.current) return;
    // 进入 Pending：记录初始坐标，暂不进入拖拽态
    fabPendingRef.current = true;
    draggingRef.current = false;
    movedRef.current = false;
    startRef.current = { px: e.clientX, py: e.clientY, x: fab.x, y: fab.y };
    btnRef.current.setPointerCapture(e.pointerId);
  };

  const onFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!fabPendingRef.current || !fab) return;
    const dx = e.clientX - startRef.current.px;
    const dy = e.clientY - startRef.current.py;
    // 阈值前：仅等待，不拖拽
    if (!draggingRef.current) {
      const threshold = e.pointerType === 'touch' ? 10 : 5;
      if (Math.hypot(dx, dy) < threshold) return;
      draggingRef.current = true;
      setDragging(true);
      movedRef.current = true;
    }
    setFab(clampFab(startRef.current.x + dx, startRef.current.y + dy));
  };

  const onFabPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!fabPendingRef.current) return;
    fabPendingRef.current = false;
    try { btnRef.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    if (draggingRef.current) {
      // 拖拽真正发生：吸附边缘 + 持久化，并抑制随后的 click
      draggingRef.current = false;
      setDragging(false);
      fabSuppressClickRef.current = true;
      setFab((prev) => {
        if (!prev) return prev;
        const W = btnRef.current?.offsetWidth ?? 56;
        const nx = prev.x + W / 2 < window.innerWidth / 2 ? FAB_MARGIN : window.innerWidth - W - FAB_MARGIN;
        const c = clampFab(nx, prev.y);
        try { localStorage.setItem(FAB_KEY, JSON.stringify(c)); } catch { /* ignore */ }
        return c;
      });
    } else {
      // 未超阈值：视为普通点击，展开留言板
      markGuestbookAsRead();
      setIsCollapsed(false);
    }
  };

  // 拖拽后抑制浏览器补发的 click，避免误触发按钮点击
  const onFabClickCapture = (e: React.MouseEvent) => {
    if (fabSuppressClickRef.current) {
      fabSuppressClickRef.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // 读取移动端安全区域（刘海/底条），避免面板被系统栏切角覆盖
  const readSafeArea = () => {
    if (typeof window === 'undefined') return { top: 0, bottom: 0 };
    const cs = getComputedStyle(document.documentElement);
    return {
      top: parseFloat(cs.getPropertyValue('--safe-area-inset-top')) || 0,
      bottom: parseFloat(cs.getPropertyValue('--safe-area-inset-bottom')) || 0,
    };
  };

  // —— 面板拖拽边界：完整保持在视口内，不进入 Header / Footer，避让安全区域 ——
  const clampPanel = (x: number, y: number) => {
    const el = panelRef.current;
    const W = el?.offsetWidth ?? (window.innerWidth < 768 ? window.innerWidth - 32 : 320);
    const H = el?.offsetHeight ?? Math.min(window.innerHeight * 0.7, 480);
    const headerH = (document.querySelector('header')?.getBoundingClientRect().height ?? 64) + HEADER_GAP;
    const footerH = (document.querySelector('footer')?.getBoundingClientRect().height ?? 60) + FOOTER_GAP;
    const safe = readSafeArea();
    const minX = PANEL_MARGIN;
    const maxX = Math.max(minX, window.innerWidth - W - PANEL_MARGIN);
    const minY = headerH + safe.top;
    const maxY = Math.max(minY, window.innerHeight - footerH - safe.bottom - H - PANEL_MARGIN);
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  // 首次进入：读 localStorage，无则默认右上角（Header 下方）；首读立即 clamp 并以 rAF 显示，避免 SSR 闪烁 / 大屏位置在小屏越界
  useEffect(() => {
    let p: { x: number; y: number } | null = null;
    try {
      const raw = localStorage.getItem(PANEL_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (typeof o?.x === 'number' && typeof o?.y === 'number') p = { x: o.x, y: o.y };
      }
    } catch { /* ignore */ }
    if (!p) {
      const headerH = (document.querySelector('header')?.getBoundingClientRect().height ?? 64) + HEADER_GAP;
      const estW = window.innerWidth < 768 ? window.innerWidth - 32 : 320;
      p = { x: window.innerWidth - estW - PANEL_MARGIN, y: headerH };
    }
    const c = clampPanel(p.x, p.y);
    const raf = requestAnimationFrame(() => {
      setPanelPos(c);
      setPanelInitialized(true);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 视口尺寸变化：重新夹紧并持久化
  useEffect(() => {
    const onResize = () => {
      setPanelPos((prev) => {
        if (!prev) return prev;
        const c = clampPanel(prev.x, prev.y);
        try { localStorage.setItem(PANEL_KEY, JSON.stringify(c)); } catch { /* ignore */ }
        return c;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 卸载时取消可能挂起的 rAF，避免拖拽中组件卸载导致更新已卸载组件
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // 仅标题栏可拖拽；避开按钮/输入框等交互元素
  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, [role="button"]')) return;
    if (!panelPos) return;
    // 进入 Pending：记录初始坐标，暂不进入拖拽态
    panelPendingRef.current = true;
    panelDraggingRef.current = false;
    panelStartRef.current = { px: e.clientX, py: e.clientY, x: panelPos.x, y: panelPos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panelPendingRef.current || !panelPos) return;
    const dx = e.clientX - panelStartRef.current.px;
    const dy = e.clientY - panelStartRef.current.py;
    // 阈值前：仅等待，不拖拽
    if (!panelDraggingRef.current) {
      const threshold = e.pointerType === 'touch' ? 10 : 5;
      if (Math.hypot(dx, dy) < threshold) return;
      panelDraggingRef.current = true;
      setPanelDragging(true);
    }
    const nx = panelStartRef.current.x + dx;
    const ny = panelStartRef.current.y + dy;
    // rAF 节流：渲染与屏幕刷新率同步，避免低端移动设备拖拽掉帧
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      setPanelPos(clampPanel(nx, ny));
    });
  };
  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panelPendingRef.current) return;
    panelPendingRef.current = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    if (panelDraggingRef.current) {
      // 拖拽真正发生：贴边磁吸 + 持久化，并抑制随后的 click
      panelDraggingRef.current = false;
      setPanelDragging(false);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      panelSuppressClickRef.current = true;
      setPanelPos((prev) => {
        if (!prev) return prev;
        const W = panelRef.current?.offsetWidth ?? 320;
        const SNAP = 10;
        let nx = prev.x;
        if (prev.x <= SNAP) nx = PANEL_MARGIN;
        else if (prev.x + W >= window.innerWidth - SNAP) nx = Math.max(PANEL_MARGIN, window.innerWidth - W - PANEL_MARGIN);
        const c = clampPanel(nx, prev.y);
        try { localStorage.setItem(PANEL_KEY, JSON.stringify(c)); } catch { /* ignore */ }
        return c;
      });
    }
    // 未超阈值：视为普通点击，不拖拽（不抑制 click，交由标题栏既有点击行为）
  };
  // 拖拽后抑制浏览器补发的 click，避免误触发标题栏点击/双击复位
  const onHandleClickCapture = (e: React.MouseEvent) => {
    if (panelSuppressClickRef.current) {
      panelSuppressClickRef.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // 双击标题栏：复位到默认右上角并持久化
  const onHandleDoubleClick = () => {
    const headerH = (document.querySelector('header')?.getBoundingClientRect().height ?? 64) + HEADER_GAP;
    const estW = window.innerWidth < 768 ? window.innerWidth - 32 : 320;
    const def = clampPanel(window.innerWidth - estW - PANEL_MARGIN, headerH);
    setPanelPos(def);
    try { localStorage.setItem(PANEL_KEY, JSON.stringify(def)); } catch { /* ignore */ }
  };

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

  // 面板展开时标记已读（覆盖刷新页面后面板仍展开的情况）
  useEffect(() => {
    if (!isCollapsed) {
      markGuestbookAsRead();
    }
  }, [isCollapsed]);

  // ESC 键：优先关写留言表单，否则关闭留言面板
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showForm) setShowForm(false);
      else if (!isCollapsed) setIsCollapsed(true);
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showForm, isCollapsed]);

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

  // 面板内联样式：独立位置 + 动态最大高度（保证完整可见，不越 Header / Footer，含安全区域）
  const safe = readSafeArea();
  const headerHNow = typeof window !== 'undefined'
    ? (document.querySelector('header')?.getBoundingClientRect().height ?? 64) + HEADER_GAP + safe.top
    : 76;
  const footerHNow = typeof window !== 'undefined'
    ? (document.querySelector('footer')?.getBoundingClientRect().height ?? 60) + FOOTER_GAP + safe.bottom
    : 72;
  const availH = (typeof window !== 'undefined' ? window.innerHeight : 800) - headerHNow - footerHNow - 16;
  const panelInlineStyle: React.CSSProperties | undefined = panelPos
    ? { left: panelPos.x, top: panelPos.y, maxHeight: Math.min(window.innerHeight * 0.7, availH) }
    : undefined;

  return (
    <>
      {/* 桌面端居中表单 */}
      {showForm && (
        <div
          className="hidden md:flex fixed inset-0 bg-black/50 items-center justify-center z-[90]"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-[var(--card-bg)] rounded-2xl p-8 w-full max-w-lg mx-4 shadow-[var(--panel-shadow)] border border-[var(--border-color)]"
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

      {/* 折叠态：可拖拽悬浮按钮（独立功能入口，与底部工具组分离） */}
      {isCollapsed ? (
        <button
          ref={btnRef}
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          onClickCapture={onFabClickCapture}
          style={fab ? { left: fab.x, top: fab.y, touchAction: 'none' } : { touchAction: 'none' }}
          className={`fixed z-[75] w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] shadow-[var(--panel-shadow-sm)] flex items-center justify-center select-none ${dragging ? 'scale-110 cursor-grabbing' : 'hover:scale-105 active:scale-95 cursor-grab'} ${fab ? '' : 'top-20 right-4'} ${dragging ? '' : 'transition-[left,top] duration-200'}`}
          title="留言板（可拖拽，松手吸附边缘）"
          aria-label="展开留言板"
        >
          <svg
            className="pointer-events-none w-5 h-5 md:w-6 md:h-6 text-[var(--text-primary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      ) : (
        // 未初始化完成（读取 localStorage / clamp）前不渲染，避免 SSR 闪烁与位置跳变
        panelInitialized && (
        <aside
          ref={panelRef}
          role="dialog"
          aria-label="留言面板"
          style={panelInlineStyle}
          className={`fixed z-[80] bg-[var(--card-bg)] backdrop-blur-md p-3 md:p-6 rounded-3xl w-[calc(100vw-2rem)] md:w-80 max-h-[70dvh] flex flex-col border border-[var(--card-border)] shadow-[var(--panel-shadow)] ${panelPos ? '' : 'top-20 right-4'} ${panelDragging ? 'select-none' : ''}`}
        >
          {/* 收起按钮 */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--card-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm leading-none shadow-md"
            aria-label="收起留言板"
            title="收起"
          >
            ×
          </button>

          {/* 标题栏（Drag Handle，仅此区域可拖拽面板；双击复位到默认位置） */}
          <div
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onClickCapture={onHandleClickCapture}
            onDoubleClick={onHandleDoubleClick}
            className={`flex justify-between items-center mb-4 select-none ${panelDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ touchAction: 'none' }}
            title="拖动移动留言板，双击复位"
          >
            <h2 className="text-base md:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--text-muted)] text-xs leading-none">⠿</span>
              留言板
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-accent hover:text-[var(--accent-hover)] text-xs md:text-sm font-medium"
            >
              {showForm ? '取消' : '写留言'}
            </button>
          </div>

          {/* 移动端表单 */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-4 p-3 bg-[var(--card-bg-inset)] rounded-lg space-y-3 md:hidden border border-[var(--card-border-inset)]">
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
            <div className="mb-4 p-3 bg-[var(--card-bg-inset)] border border-[var(--card-border-inset)] rounded-lg text-[var(--text-muted)] text-sm text-center">
              正在重试加载... ({retryCount}/{MAX_RETRIES})
            </div>
          )}

          {/* 评论列表 */}
          <div className="space-y-3 md:space-y-5 overflow-y-auto flex-1 min-h-0">
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
        )
      )}
    </>
  );
}
