"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  setTheme,
  toggleTheme,
  type Theme,
} from "@/lib/theme/theme-store";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * ThemeProvider
 *
 * 架构反转：不再「我管 state + effect 同步给外部」，而是订阅 theme-store 这个
 * external store 的 source。store 负责 localStorage / matchMedia / DOM 同步 /
 * 跨 tab 同步，Provider 只做 context 桥接。
 *
 * - useSyncExternalStore：SSR 用 getServerSnapshot('dark')，与 layout.tsx 的
 *   blocking script 保底一致 → 无 hydration mismatch；客户端首次订阅时 store
 *   同步初始化，若值与 SSR 不同主动 callback 触发一次 reconcile。
 * - useMemo 包裹 value（方案一）：本项目消费者仅 ThemeToggle /
 *   FloatingThemeToggle 且都读 isDark 状态，方案二的拆分 context 收益为 0。
 *   toggleTheme / setTheme 是模块级 stable function，依赖列表里引用永不变。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
    }),
    // toggleTheme / setTheme 是模块级 stable function（引用永不变），
    // ESLint 视为 outer scope values 不算有效依赖；只跟 theme 变化重算。
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
