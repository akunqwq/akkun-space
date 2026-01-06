"use client";

import { useEffect, useState } from "react";
import { createHighlighter } from "shiki";

interface ClientCodeBlockProps {
  children: string;
  className?: string;
}

export default function ClientCodeBlock({ children, className }: ClientCodeBlockProps) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 检测当前主题状态
  const checkTheme = () => {
    const htmlElement = document.documentElement;
    const isDarkMode = htmlElement.classList.contains('dark');
    setIsDark(isDarkMode);
  };

  // 组件挂载后才启用主题检测
  useEffect(() => {
    setMounted(true);
    checkTheme();

    // 监听主题切换
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function runHighlight() {
      const highlighter = await createHighlighter({
        themes: ["vitesse-dark", "github-light"],
        langs: [
          "javascript", "typescript", "json", "css",
          "html", "bash", "python", "cpp", "java", "markdown",
           "vue", "tsx", "jsx" 
        ],
      });

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
  }, [children, className, isDark, mounted]);

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
