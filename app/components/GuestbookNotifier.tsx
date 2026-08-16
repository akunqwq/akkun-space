"use client";

import { useEffect, useRef, useCallback } from "react";
import { updateFaviconBadge } from "@/lib/favicon-badge";

/**
 * 留言板未读通知管理器
 *
 * 职责：
 * 1. 轮询检测新留言（每 45 秒）
 * 2. 通过 Favicon 徽章提醒用户
 * 3. 响应 localStorage 中「已读时间戳」的变化
 *
 * 使用方式：放在 layout.tsx 中全局挂载即可。
 * RecentComments 组件负责在打开面板时写入已读时间戳，
 * 本组件会自动检测到变化并清除徽章。
 */

const POLL_INTERVAL = 45_000; // 45 秒轮询一次（留言频率不高，无需太频繁）
const STORAGE_KEY = "guestbook-last-read-at"; // localStorage 存储的已读时间戳

export default function GuestbookNotifier() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSinceRef = useRef<string | null>(null);

  /** 从 localStorage 读取已读时间戳 */
  const getLastReadAt = useCallback((): string => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  }, []);

  /** 检查未读数并更新 Favicon */
  const checkUnread = useCallback(async () => {
    const since = getLastReadAt();
    if (!since) return; // 用户从未打开过留言板，不显示徽章

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`/api/guestbook?since=${encodeURIComponent(since)}`, {
        cache: "no-store",
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) return;

      const json = await res.json();
      const unread = (json.unread as number) ?? 0;
      await updateFaviconBadge(unread);
    } catch {
      // 静默失败
    }
  }, [getLastReadAt]);

  // 轮询 + 首次检查
  useEffect(() => {
    // 页面获得焦点时立即检查（用户从其他标签页切回来）
    const onFocus = () => checkUnread();
    window.addEventListener("focus", onFocus);

    // 立即执行首次检查
    checkUnread();

    // 启动定时轮询
    timerRef.current = setInterval(checkUnread, POLL_INTERVAL);

    return () => {
      window.removeEventListener("focus", onFocus);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkUnread]);

  // 监听来自 RecentComponents 的「已读」信号
  // 当留言板被打开时，RecentComments 会更新 localStorage，
  // 我们通过 storage event（跨标签页）或轮询来响应。
  // 同标签页内：依赖轮询 + focus 检测已经足够实时（≤45s）。

  // 组件不渲染任何 UI —— 纯逻辑层
  return null;
}

/**
 * 标记留言为已读（供 RecentComments 等组件调用）
 * 写入当前时间到 localStorage，GuestbookNotifier 会在下次检查时清除徽章。
 */
export function markGuestbookAsRead(): void {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}
