import type { MediaItem } from "@/lib/media";

export type PlayerMode = "hidden" | "expanded" | "mini" | "bubble";

export interface Vec2 {
  x: number;
  y: number;
}

export interface FloatingState {
  mini: Vec2 & { dock: "left" | "center" | "right" };
  bubble: Vec2;
}

export interface MediaState {
  queue: MediaItem[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number; // 已缓冲到的秒数
  volume: number; // 0..1
  muted: boolean;
  rate: number;
  mode: PlayerMode;
  showPlaylist: boolean;
  history: MediaItem[];
  floating: FloatingState;
}

export interface MediaContextValue extends MediaState {
  currentItem: MediaItem | null;

  // 公开操作
  playItem: (item: MediaItem, queue?: MediaItem[]) => void;
  playQueue: (items: MediaItem[], startIndex?: number) => void;
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
  setMode: (m: PlayerMode) => void;

  // 浮动位置（mini / bubble 各自独立）
  setMiniPos: (x: number, y: number, dock: "left" | "center" | "right") => void;
  setBubblePos: (x: number, y: number) => void;

  togglePlaylist: () => void;

  // 供媒体元素事件回调（surfaces 内部使用）
  reportTime: (t: number) => void;
  reportDuration: (d: number) => void;
  reportBuffered: (b: number) => void;
  reportEnded: () => void;
}
