'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function FloatingThemeToggle() {
  const [isVisible, setIsVisible] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  // 滚动时隐藏，停止滚动后显示
  // 说明：setIsVisible 都在 handleScroll 事件回调里（非 effect body 同步执行），
  // 不触发 react-hooks/set-state-in-effect 规则。这是合法的「订阅外部世界」用法。
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsVisible(false);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

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
