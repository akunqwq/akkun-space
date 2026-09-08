/**
 * useLikedArticle.ts - 轻量版 localStorage 点赞状态订阅
 * =================================================================
 *
 * 设计原则：
 * - subscribe 跨 tab 的 storage event（同一浏览器多 tab 同步）
 * - getServerSnapshot 返回 false（SSR 兜底，避免 hydration mismatch；
 *   首帧用 server snapshot，hydration 完成后 React 自动 reconcile 用 client snapshot）
 * - 同 tab 自己 setItem 不回灌——写入方靠 setState 自行反映用户操作，
 *   不依赖 hook 把"自己刚写的值"再传回来（避免小型状态库式过度设计）
 *
 * 这正是 useSyncExternalStore 的合理用法（非机械替换 mount flag）：
 * 它同时解决两个问题——跨 tab 订阅（storage event）+ SSR 兜底（getServerSnapshot）。
 */

'use client'

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'blog_liked_articles'

function getLikedSlugs(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

/**
 * 订阅"当前 slug 是否已被点赞"。
 *
 * - 跨 tab 同步：storage event 触发重新读取
 * - 同 tab 写入：写入方自行 setState 反映，不靠本 hook 回灌
 */
export function useLikedArticle(slug: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getLikedSlugs().has(slug),
    () => false,
  )
}
