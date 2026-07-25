// 媒体中心数据层 — Phase 1 纯音频
// Phase 2 视频将独立设计，不复用此 MediaItem 类型。

export interface MediaItem {
  id: string;
  title: string;
  artist: string; // 艺术家
  album?: string; // 专辑
  cover?: string; // 封面图 URL（可选；缺省时按 src 同名 .jpg 解析）
  src: string; // 媒体文件 URL
  duration?: number; // 秒（用于列表展示，可选）
  tags?: string[];
  description?: string;
}

// 示例数据：本地 FLAC + 远程测试 mp3 占位，部署时替换为自有资源。
export const mediaItems: MediaItem[] = [
  {
    id: "song-1",
    title: "恋ひ恋ふ縁",
    artist: "Famishin, KOTOKO",
    album: "本地曲库",
    cover: "/media/music/19019352137357551.jpg",
    src: "/media/music/Famishin%2CKOTOKO%20-%20%E6%81%8B%E3%81%B2%E6%81%8B%E3%81%B5%E7%B8%81.flac",
    tags: ["ACG", "galgame"],
    description: "本地曲目",
  },
  {
    id: "song-2",
    title: "SoundHelix Song 2",
    artist: "SoundHelix",
    album: "测试曲库",
    cover: "https://picsum.photos/seed/akkun-music-2/400/400",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 489,
    tags: ["电子", "测试"],
    description: "当前远程测试曲目（SoundHelix）服务端不支持 Range 请求，进度条拖拽受限。如需测试平滑 Seek，请切换至【本地 FLAC 测试曲】。",
  },
  {
    id: "song-3",
    title: "SoundHelix Song 3",
    artist: "SoundHelix",
    album: "测试曲库",
    cover: "https://picsum.photos/seed/akkun-music-3/400/400",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 358,
    tags: ["电子", "测试"],
    description: "当前远程测试曲目（SoundHelix）服务端不支持 Range 请求，进度条拖拽受限。如需测试平滑 Seek，请切换至【本地 FLAC 测试曲】。",
  },
];

export function getMediaById(id: string): MediaItem | undefined {
  return mediaItems.find((i) => i.id === id);
}

// 封面解析约定：优先用显式 cover；否则取 src 同名 .jpg（xxx.flac → xxx.jpg）。
// 该 .jpg 不存在时，由 <CoverImage> 的 onError 回退到默认封面 /media/default-cover.svg。
export function resolveCover(item: MediaItem): string {
  if (item.cover) return item.cover;
  return item.src.replace(/\.[^/.]+$/, ".jpg");
}
