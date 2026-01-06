'use client'

import { useState, useEffect, useRef } from 'react'
import { getAllWallpapers, type Wallpaper } from '@/lib/wallpapers'

export default function WallpaperWall() {
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null)
  const [displayedWallpapers, setDisplayedWallpapers] = useState<Wallpaper[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  const wallpapersPerPage = 12
  const allWallpapers = getAllWallpapers()

  // 初始化
  useEffect(() => {
    setDisplayedWallpapers(allWallpapers.slice(0, wallpapersPerPage))
  }, [])

  // 懒加载观察器
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    if (observerRef.current) observer.observe(observerRef.current)

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current)
    }
  }, [loading, page])

  const loadMore = () => {
    if (loading) return
    setLoading(true)

    setTimeout(() => {
      const next = page + 1
      const start = next * wallpapersPerPage
      const end = start + wallpapersPerPage
      const nextChunk = allWallpapers.slice(start, end)

      if (nextChunk.length > 0) {
        setDisplayedWallpapers(prev => [...prev, ...nextChunk])
        setPage(next)
      }

      setLoading(false)
    }, 200)
  }

  const handleDownload = async (url: string, title: string) => {
    try {
      const ext = url.split("?")[0].split(".").pop() || "jpg"
      const safeName = title.replace(/[\/\\:*?"<>|]/g, "_")
      const fileName = `${safeName}.${ext}`

      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = fileName
      link.click()

      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, "_blank")
    }
  }

  return (
    <>
      <div className="bg-[var(--card-bg)] backdrop-blur-lg rounded-2xl shadow-sm p-6 border border-[var(--border-color)]">
        <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)] text-center">🌸壁纸收藏馆</h2>

        {/* Masonry Grid */}
        <div className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          lg:grid-cols-3 
          gap-4
          auto-rows-[10px]
        ">
          {displayedWallpapers.map(item => {
            // 自动计算 Masonry 高度
            const [w, h] = item.resolution?.split("×").map(Number) ?? [1,1]
            const span = Math.ceil((h / w) * 30) // 控制高度比例

            return (
              <div
                key={item.id}
                style={{ gridRowEnd: `span ${span}` }}
                className="relative overflow-hidden rounded-xl cursor-pointer group"
                onClick={() => setSelectedWallpaper(item)}
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent 
                  opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                  <div className="text-white">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs opacity-80">{item.resolution} • {item.fileSize}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 懒加载触发器 */}
        {displayedWallpapers.length < allWallpapers.length && (
          <div ref={observerRef} className="flex justify-center py-6 text-[var(--text-muted)]">
            {loading ? "加载中..." : "下滑加载更多..."}
          </div>
        )}
      </div>

      {/* 壁纸预览 Modal */}
      {selectedWallpaper && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedWallpaper(null)}
        >
          <div
            className="relative bg-[var(--card-bg)] rounded-xl overflow-hidden w-full max-w-6xl h-[90vh] flex flex-col sm:flex-row border border-[var(--border-color)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-1 bg-black/5 flex items-center justify-center">
              <img
                src={selectedWallpaper.url}
                alt={selectedWallpaper.title}
                className="max-h-full max-w-full object-contain p-4"
              />
            </div>

            <div className="w-full sm:w-96 p-6 overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">{selectedWallpaper.title}</h3>

              <div className="space-y-3 mb-6">
                {selectedWallpaper.author && (
                  <div>
                    <span className="text-[var(--text-muted)] text-sm">作者</span>
                    <p className="font-medium text-[var(--text-primary)]">{selectedWallpaper.author}</p>
                  </div>
                )}

                {selectedWallpaper.resolution && (
                  <div>
                    <span className="text-[var(--text-muted)] text-sm">分辨率</span>
                    <p className="font-medium text-[var(--text-primary)]">{selectedWallpaper.resolution}</p>
                  </div>
                )}

                {selectedWallpaper.fileSize && (
                  <div>
                    <span className="text-[var(--text-muted)] text-sm">文件大小</span>
                    <p className="font-medium text-[var(--text-primary)]">{selectedWallpaper.fileSize}</p>
                  </div>
                )}

                {selectedWallpaper.uploadedAt && (
                  <div>
                    <span className="text-[var(--text-muted)] text-sm">上传时间</span>
                    <p className="font-medium text-[var(--text-primary)]">{selectedWallpaper.uploadedAt}</p>
                  </div>
                )}

                {selectedWallpaper.source && (
                  <div>
                    <span className="text-[var(--text-muted)] text-sm">来源</span>
                    <p className="font-medium text-[var(--text-primary)]">
                      {selectedWallpaper.sourceUrl ? (
                        <a
                          href={selectedWallpaper.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedWallpaper.source}
                        </a>
                      ) : (
                        selectedWallpaper.source
                      )}
                    </p>
                  </div>
                )}

                {selectedWallpaper.tags && selectedWallpaper.tags.length > 0 && (
                  <div>
                    <span className="text-[var(--text-muted)] text-sm">标签</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedWallpaper.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-[var(--tag-bg)] text-[var(--tag-text)] px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDownload(selectedWallpaper.url, selectedWallpaper.title)}
                className="w-full py-3 bg-[var(--btn-primary)] text-white rounded-xl hover:bg-[var(--btn-primary-hover)] transition-all font-medium"
              >
                下载原图
              </button>
            </div>

            <button
              onClick={() => setSelectedWallpaper(null)}
              className="absolute top-4 right-4 bg-[var(--card-bg)] rounded-full p-2 shadow-lg text-[var(--text-primary)] border border-[var(--border-color)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
