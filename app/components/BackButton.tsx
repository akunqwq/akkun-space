"use client";

export default function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="px-5 py-2.5 rounded-full font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] transition-colors"
    >
      回到上一页
    </button>
  );
}
