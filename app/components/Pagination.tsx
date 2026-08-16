/**
  * 分页组件
 */

import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

function pageHref(page: number): string {
  return page <= 1 ? "/" : `/?page=${page}`;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const baseBtn =
    "inline-flex items-center justify-center min-w-9 h-9 px-3 rounded-lg text-sm border border-[var(--border-color)] transition-colors";
  const inactive =
    "bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-accent hover:border-accent";
  const active = "bg-accent text-white border-accent font-semibold";
  const disabled =
    "opacity-40 pointer-events-none bg-[var(--card-bg)] text-[var(--text-muted)]";

  return (
    <nav className="flex items-center justify-center gap-2 mt-12 flex-wrap">
      {/* 上一页 */}
      <Link
        href={pageHref(currentPage - 1)}
        aria-label="上一页"
        className={`${baseBtn} ${currentPage <= 1 ? disabled : inactive}`}
      >
        ← 上一页
      </Link>

      {/* 页码 */}
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(p)}
          aria-current={p === currentPage ? "page" : undefined}
          className={`${baseBtn} ${p === currentPage ? active : inactive}`}
        >
          {p}
        </Link>
      ))}

      {/* 下一页 */}
      <Link
        href={pageHref(currentPage + 1)}
        aria-label="下一页"
        className={`${baseBtn} ${currentPage >= totalPages ? disabled : inactive}`}
      >
        下一页 →
      </Link>
    </nav>
  );
}
