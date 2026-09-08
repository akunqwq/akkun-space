"use client";

import { useEffect, useState } from "react";
import { createHighlighter, type Highlighter } from "shiki";
import { useIsDarkMode } from "@/lib/hooks/useIsDarkMode";

interface ClientCodeBlockProps {
  children: string;
  className?: string;
}

// 全局单例：所有代码块共享同一个 highlighter 实例，避免每个代码块重复创建
// 使用 undefined 表示尚未初始化；若初始化失败则清空，下次可重试
let highlighterPromise: Promise<Highlighter> | undefined;

function getSharedHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["vitesse-dark", "github-light"],
      langs: [
        "javascript", "typescript", "json", "css",
        "html", "bash", "python", "cpp", "java", "markdown",
        "vue", "tsx", "jsx"
      ],
    }).catch((err) => {
      // 初始化失败：清空缓存，让后续代码块可以重新尝试创建
      highlighterPromise = undefined;
      throw err;
    });
  }
  return highlighterPromise;
}

export default function ClientCodeBlock({ children, className }: ClientCodeBlockProps) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  // 主题由 useSyncExternalStore 订阅 documentElement class，无需 mounted flag + checkTheme + MutationObserver
  const isDark = useIsDarkMode();

  // 代码高亮：依赖 children/className/isDark，主题切换时自动重新高亮
  useEffect(() => {
    async function runHighlight() {
      const highlighter = await getSharedHighlighter();

      let lang = className?.replace("language-", "") || "text";
      // 添加映射支持简写
      if (lang === "js") lang = "javascript";
      if (lang === "ts") lang = "typescript";
      if (lang === "md") lang = "markdown";
      if (lang === "vue") lang = "html";
      if (lang === "tsx") lang = "typescript";
      if (lang === "jsx") lang = "javascript";

      const generated = highlighter.codeToHtml(children, {
        lang,
        theme: isDark ? "vitesse-dark" : "github-light",
      });

      setHtml(generated);
    }

      runHighlight();
  }, [children, className, isDark]);

  // 语言标签
  const langLabel = (className || "").replace("language-", "").toUpperCase();

  // 复制功能
  const copyCode = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative my-6 rounded-lg overflow-hidden border border-[var(--border-color)]">

      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 text-xs border-b bg-[var(--code-header-bg)] border-[var(--code-header-border)] text-[var(--code-header-text)]">

        {/* 左：语言标签 */}
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-gray-800/50 text-white">
          {langLabel || "CODE"}
        </span>

        {/* 右：复制按钮 */}
        <button
          onClick={copyCode}
          className={`px-2 py-0.5 rounded text-[10px] hover:opacity-80 transition-opacity ${copied ? 'text-green-400' : ''}`}
        >
          {copied ? "✓" : "复制"}
        </button>
      </div>

      {/* 代码高亮区域 */}
      <div
        className="text-sm shiki"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
