"use client";

import { useState, useEffect } from "react";
import type { TocItem } from "../../lib/toc";

export default function TableOfContents({ headings }: { headings: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 取视口内最靠上的标题作为当前节
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      // 顶部留出固定 Header 高度，底部留 70% 让下一节提前激活
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav
      aria-label="文章目录"
      className="mb-8 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden"
    >
      {/* 移动端可折叠的标题栏 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="md:hidden w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
        aria-expanded={open}
      >
        <span>目录</span>
        <span
          className={`transition-transform duration-200 text-[var(--text-muted)] ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {/* 桌面端标题（静态） */}
      <p className="hidden md:block px-5 pt-4 pb-2 text-sm font-semibold text-[var(--text-secondary)]">
        目录
      </p>

      <div className={`${open ? "block" : "hidden"} md:block px-5 pb-4`}>
        <ul className="space-y-1 border-l border-[var(--border-color)]">
          {headings.map((h) => (
            <li key={h.id} className={h.level === 3 ? "ml-4" : ""}>
              <a
                href={`#${h.id}`}
                onClick={() => setOpen(false)}
                className={`block py-1 -ml-px pl-3 text-sm transition-colors border-l-2 ${
                  activeId === h.id
                    ? "border-[var(--btn-primary)] text-[var(--btn-primary)] font-medium"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
