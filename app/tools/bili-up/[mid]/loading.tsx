// app/tools/bili-up/[mid]/loading.tsx
// -----------------------------------------------------------------------------
// 路由级骨架屏：服务端拉取 B 站 API 的等待期，用毛玻璃流光占位，
// 避免画面从空白突兀切入（SSG/ISR 未命中缓存时的首屏体验）。
// 由 app/tools/layout.tsx 的 GlassPage 包裹，自然落在玻璃面板内。
// -----------------------------------------------------------------------------

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function Loading() {
  return (
    <section aria-busy="true" aria-label="加载中">
      <Skeleton className="mb-4 h-4 w-24 rounded" />

      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="mt-2 h-4 w-full max-w-md rounded" />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="mb-3 h-5 w-28 rounded" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-[var(--card-border)]"
            >
              <Skeleton className="aspect-video rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
