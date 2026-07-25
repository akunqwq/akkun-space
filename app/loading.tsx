export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--border-color)]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--btn-primary)] animate-spin" />
      </div>
      <p className="text-sm text-[var(--text-muted)] animate-pulse">加载中…</p>
    </div>
  );
}
