/**
 * Theme External Store
 * -----------------------------------------------------------------------------
 * 模块级 external store：把 theme 从「Provider 管 state + effect 同步给外部」
 * 反转为「store 是唯一 source of truth，UI 通过 useSyncExternalStore 订阅」。
 *
 * 三个强制约束（实现时必须满足）：
 * 1. getSnapshot 返回 primitive（Theme 字符串 union）—— 天然安全，不会因
 *    引用不等触发 useSyncExternalStore 无限渲染。
 * 2. subscribe 是模块级 stable function —— useSyncExternalStore 要求 subscribe
 *    引用稳定，否则每次 render 都重订阅。
 * 3. setTheme 写入 localStorage 后主动 emitChange —— 同 tab 内 setItem 不会
 *    触发 storage event 给自己，必须主动通知 listeners，否则同 tab 切换失效。
 *
 * 防闪烁（FOUC）机制：首帧 DOM 的 `.dark` class 由 `app/layout.tsx` 的 blocking
 * inline script 在 `<head>` 解析阶段同步注入。本 store 的 applyToDocument 只在
 * 用户/系统主动变化时同步给 DOM，不负责首帧（避免与 blocking script 冗余/冲突）。
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
/**
 * SSR / 首次 hydration 的保底默认。
 * 必须与 `app/layout.tsx` 的 blocking script 保底分支一致——否则 React state
 * 层（如 ThemeToggle 图标）与首帧 DOM `.dark` class 错配，触发 hydration mismatch。
 */
const SERVER_DEFAULT: Theme = "dark";

// ==================== 模块级状态 ====================

let currentTheme: Theme = SERVER_DEFAULT;
let hasInitialized = false;
let externalListenersRegistered = false;
const listeners = new Set<() => void>();

// ==================== DOM 同步 ====================

/**
 * 同步 theme 到 <html> class + meta 标签。
 * 仅在用户/系统主动变化时调用——首帧由 layout.tsx 的 blocking script 负责。
 */
function applyToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);

  const metaTheme = document.querySelector(
    'meta[name="theme-color"]'
  ) as HTMLMetaElement | null;
  const metaColorScheme = document.querySelector(
    'meta[name="color-scheme"]'
  ) as HTMLMetaElement | null;
  if (metaTheme) metaTheme.content = isDark ? "#0d1116" : "#ffffff";
  if (metaColorScheme) metaColorScheme.content = isDark ? "dark" : "light";
}

// ==================== 初始化（客户端首次订阅时） ====================

/**
 * 客户端首次订阅时同步读取 localStorage + matchMedia，确定真实主题。
 *
 * 为什么不在模块加载时（IIFE）初始化？
 *   模块在 SSR 时也会加载；IIFE 若在客户端 hydration 阶段执行，会让 getSnapshot
 *   返回真实值，与 SSR HTML（用 SERVER_DEFAULT 渲染）不一致 → hydration mismatch。
 *   放到 subscribe 首次调用时（hydration 完成后），首次 render 仍用 SERVER_DEFAULT，
 *   与 SSR 一致；之后 subscribe 内部 callback() 触发一次 re-render 切到真实值。
 *
 * 主题切换的视觉影响：DOM 层（.dark class）由 blocking script 已处理，store 的
 * React state 切换只影响派生值（如 ThemeToggle 图标），微小 reconcile 可接受。
 */
function initializeIfNeeded(): void {
  if (hasInitialized || typeof window === "undefined") return;
  hasInitialized = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      currentTheme = saved;
      return;
    }
    // 无显式保存 → 跟随系统偏好
    if (window.matchMedia) {
      const prefersLight = window.matchMedia(
        "(prefers-color-scheme: light)"
      ).matches;
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersLight) currentTheme = "light";
      else if (prefersDark) currentTheme = "dark";
      // 都不匹配 → 保持 SERVER_DEFAULT
    }
  } catch {
    // localStorage / matchMedia 不可用时保持 SERVER_DEFAULT
  }
}

// ==================== useSyncExternalStore 接口 ====================

/**
 * 订阅 theme 变化。
 * 模块级 stable function（引用永不变），满足 useSyncExternalStore 要求。
 */
export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // 首次订阅：同步初始化 + 注册外部监听
  initializeIfNeeded();
  ensureExternalListeners();
  // 初始化后若值与 SSR 默认不同，主动通知这个 callback 触发一次 re-render
  if (currentTheme !== SERVER_DEFAULT) {
    callback();
  }
  return () => {
    listeners.delete(callback);
  };
}

/** 返回当前 theme（primitive，引用稳定） */
export function getSnapshot(): Theme {
  return currentTheme;
}

/** SSR / 首次 hydration 的 snapshot —— 与 blocking script 保底一致 */
export function getServerSnapshot(): Theme {
  return SERVER_DEFAULT;
}

// ==================== 用户操作 ====================

/**
 * 显式设置 theme（用户主动切换）。
 * 写 localStorage + 同步 DOM + 主动通知 listeners（同 tab setItem 不触发 storage event）。
 */
export function setTheme(newTheme: Theme): void {
  if (newTheme === currentTheme) return;
  currentTheme = newTheme;
  try {
    localStorage.setItem(STORAGE_KEY, newTheme);
  } catch {
    // ignore storage errors
  }
  applyToDocument(newTheme);
  emitChange();
}

/** 在 light/dark 之间切换 */
export function toggleTheme(): void {
  setTheme(currentTheme === "light" ? "dark" : "light");
}

// ==================== 内部：通知 + 外部监听注册 ====================

function emitChange(): void {
  listeners.forEach((cb) => cb());
}

/**
 * 注册 storage（跨 tab 同步）+ matchMedia（系统偏好变化）监听。
 * 只注册一次（listenersRegistered guard）。
 */
function ensureExternalListeners(): void {
  if (externalListenersRegistered || typeof window === "undefined") return;
  externalListenersRegistered = true;

  // 跨 tab 同步：其他 tab 的 localStorage 修改会触发 storage event
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    const next =
      e.newValue === "dark" || e.newValue === "light"
        ? (e.newValue as Theme)
        : null;
    if (next && next !== currentTheme) {
      currentTheme = next;
      applyToDocument(next);
      emitChange();
    }
  });

  // 系统偏好变化：仅当用户未显式保存时跟随
  if (window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return; // 用户已显式保存，不跟随系统
        const prefersLight = window.matchMedia(
          "(prefers-color-scheme: light)"
        ).matches;
        const sys: Theme = e.matches ? "dark" : prefersLight ? "light" : "dark";
        if (sys !== currentTheme) {
          currentTheme = sys;
          applyToDocument(sys);
          emitChange();
        }
      } catch {
        // ignore
      }
    });
  }
}
