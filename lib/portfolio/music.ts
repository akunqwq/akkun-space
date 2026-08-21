// 音乐库数据层 —— 供首页 Lobby 精选与 /music 页面使用。
// 数据源：data/content/music.json（本文件保留类型定义）。
// ⚠️ 音频/封面托管在 Supabase Storage 私有桶 `music`：
//   - src / cover 存的是「桶内对象路径」（如 test/audio/song1.mp3），不是可直接访问的 URL。
//   - 播放/显示前需经 /api/music/url 签发临时签名 URL（见 lib/music-url.ts）。
import musicData from "@/data/content/music.json";

export const MUSIC_BUCKET = "music";

export interface MusicItem {
  id: string;
  title: string;
  artist: string; // 艺术家
  album?: string; // 专辑
  cover?: string; // 封面在桶内的对象路径（如 test/cover/covermusic1.jpg）；缺省回退本地 /music/default-cover.svg
  src: string; // 音频在桶内的对象路径（如 test/audio/song1.mp3）
  duration?: number; // 秒（用于列表展示，可选）
  tags?: string[];
  description?: string;
}

export const musicItems: MusicItem[] = musicData as MusicItem[];

// 默认封面（始终可公开访问，不进私有桶）
export const DEFAULT_COVER = "/music/default-cover.svg";
