import type { MusicItem } from "@/lib/music";

// 自研常驻播放器「AkkunPlayer」的正式代号（用于 aria-label / 注释等标识）。
export const PLAYER_NAME = "AkkunPlayer";

// 精确播放状态机：点击到真播放之间存在 loading/buffering 过渡态，
// 避免「点播即转」与「00:00/00:00」的假象。
export type PlaybackState =
  | "idle" // 无曲目 / 已关闭
  | "loading" // 已请求播放，正在签 URL / 拉取前几 KB / 解析 metadata
  | "buffering" // 播放中网络 stall（音频触发 waiting）
  | "playing" // 真正在播放
  | "paused" // 用户暂停（未结束）
  | "ended" // 播完（单曲）
  | "error"; // 加载/播放失败（可重试）

export interface MusicState {
  queue: MusicItem[];
  currentIndex: number;
  isPlaying: boolean; // 播放意图（点击过且未暂停/结束）
  playbackState: PlaybackState; // 精确播放状态
  currentTime: number;
  duration: number;
  buffered: number; // 已缓冲到的秒数
  volume: number; // 0..1
  muted: boolean;
  rate: number;
  minimized: boolean; // true=收起为可拖拽悬浮窗
}

export interface MusicContextValue extends MusicState {
  currentItem: MusicItem | null;

  // 公开操作
  playItem: (item: MusicItem, queue?: MusicItem[]) => void;
  playQueue: (items: MusicItem[], startIndex?: number) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  seekBy: (delta: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleRate: () => void;
  toggleMinimize: () => void; // 收起/展开为悬浮窗
  close: () => void; // 停止并收起播放器
  retry: () => void; // 加载/播放失败后重试（重签续播）

  // 供媒体元素事件回调（AudioSurface 内部使用）
  reportTime: (t: number) => void;
  reportDuration: (d: number) => void;
  reportBuffered: (b: number) => void;
  reportEnded: () => void;
  reportError: () => void; // 音频加载/播放出错（如签名 URL 过期）→ 触发重签续播
}
