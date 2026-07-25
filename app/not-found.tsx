import Link from "next/link";
import BackButton from "./components/BackButton";

export const metadata = {
  title: "404 - 页面走丢啦",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <p
          className="rainbow-text text-8xl sm:text-9xl font-extrabold leading-none select-none mb-4"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-3">
          这里暂时还没有被开发哦(´▽｀)~
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed">
          你访问的页面可能已经被移动、删除，
          <br className="hidden sm:block" />
          或者还在阿鲲的待办清单里，没有出生呢。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="btn-primary px-5 py-2.5 rounded-full font-medium transition-transform hover:scale-105 active:scale-95"
          >
            回到首页
          </Link>
          <Link
            href="/articles"
            className="px-5 py-2.5 rounded-full font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] transition-colors"
          >
            去逛逛文章
          </Link>
          <BackButton />
        </div>
      </div>
    </div>
  );
}
