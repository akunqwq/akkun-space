'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // 避免hydration不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
      className="
        p-2 rounded-lg
        bg-[var(--theme-toggle-bg)]
        hover:bg-[var(--theme-toggle-hover)]
        transition-colors
        focus:outline-none
      "
    >
      {/* 当前为暗色 → 显示太阳（提示可切回亮色） */}
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--text-primary)]" />
      )}
    </button>
  );
}
