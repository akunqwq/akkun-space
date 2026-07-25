"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("页面运行错误:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <p
          className="rainbow-text text-7xl sm:text-8xl font-extrabold leading-none select-none mb-4"
          aria-hidden="true"
        >
          qwq
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-3">
          出现了一点问题 qwq
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed">
          页面渲染时遇到了一点意外，
          <br className="hidden sm:block" />
          可以试试重试，或者回首页逛逛。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-primary px-5 py-2.5 rounded-full font-medium transition-transform hover:scale-105 active:scale-95"
          >
            重试
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] transition-colors"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}
