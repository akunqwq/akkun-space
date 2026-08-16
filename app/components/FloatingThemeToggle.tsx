'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function FloatingThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  // 避免hydration不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 滚动时隐藏，停止滚动后显示
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    const handleScroll = () => {
      isScrolling = true;
      setIsVisible(false);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        setIsVisible(true);
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
      className={`
        fixed bottom-4 right-4
        p-3 rounded-full
        bg-[var(--theme-toggle-bg)]/80
        hover:bg-[var(--theme-toggle-hover)]
        backdrop-blur-sm
        shadow-lg hover:shadow-xl
        transition-all duration-300
        focus:outline-none
        z-100
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      {isDark ? (
        <Sun className="w-6 h-6 text-yellow-400" />
      ) : (
        <Moon className="w-6 h-6 text-[var(--text-primary)]" />
      )}
    </button>
  );
}
