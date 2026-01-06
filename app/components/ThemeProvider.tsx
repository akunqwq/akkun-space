"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

type Theme = "light" | "dark";

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

const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 在客户端渲染前（组件实例化阶段）同步读取 localStorage / matchMedia
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      // 尝试读取 localStorage（同步执行）
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved === "dark" || saved === "light") return saved as Theme;

      // 否则读系统首选（若可访问）
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
    } catch (e) {
      // ignore
    }
    return "light";
  });

  const [mounted, setMounted] = useState(false);

  const applyToDocument = useCallback((isDark: boolean) => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);

    const metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement | null;
    if (metaTheme) metaTheme.content = isDark ? "#0d1116" : "#ffffff";
    if (metaColorScheme) metaColorScheme.content = isDark ? "dark" : "light";
  }, []);

  // 应用初始主题（只执行一次）
  useEffect(() => {
    setMounted(true);
    applyToDocument(theme === "dark");
  }, [theme, applyToDocument]);

  // 仅在用户未显式保存时，跟随系统变化
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return;

      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        const sys: Theme = e.matches ? "dark" : "light";
        setThemeState(sys);
        applyToDocument(e.matches);
      };
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } catch {
      // ignore
    }
  }, [applyToDocument, mounted]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // ignore storage errors
      }
      applyToDocument(newTheme === "dark");
    },
    [applyToDocument]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
