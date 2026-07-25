"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { MediaItem } from "@/lib/media";
import { resolveCover } from "@/lib/media";
import {
  resolveMiniPosition,
  resolveBubblePosition,
  setMiniLayout,
  saveBubblePosition,
  clampPosition,
  classifyDock,
  type Dock,
} from "@/lib/media-player-storage";
import type { MediaContextValue, MediaState, PlayerMode } from "./types";
import AudioSurface from "./AudioSurface";
import FloatingPlayer from "./FloatingPlayer";
import Playlist from "./Playlist";

const RATES = [0.5, 1, 1.25, 1.5, 2];

const initialState: MediaState = {
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  muted: false,
  rate: 1,
  mode: "hidden",
  showPlaylist: false,
  history: [],
  floating: {
    mini: { x: 0, y: 0, dock: "center" as const },
    bubble: { x: 0, y: 0 },
  },
};

type Action =
  | { type: "LOAD"; queue: MediaItem[]; index: number }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SET_TIME"; t: number }
  | { type: "SET_DURATION"; d: number }
  | { type: "SET_BUFFERED"; b: number }
  | { type: "SET_VOLUME"; v: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_RATE"; r: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SET_MODE"; m: PlayerMode }
  | { type: "TOGGLE_PLAYLIST" }
  | { type: "ENDED" }
  | { type: "PUSH_HISTORY"; item: MediaItem }
  | { type: "SET_MINI_POS"; x: number; y: number; dock: "left" | "center" | "right" }
  | { type: "SET_BUBBLE_POS"; x: number; y: number };

function reducer(state: MediaState, action: Action): MediaState {
  switch (action.type) {
    case "LOAD":
      return { ...state, queue: action.queue, currentIndex: action.index };
    case "PLAY":
      return { ...state, isPlaying: true };
    case "PAUSE":
      return { ...state, isPlaying: false };
    case "SET_TIME":
      return { ...state, currentTime: action.t };
    case "SET_DURATION":
      return { ...state, duration: action.d };
    case "SET_BUFFERED":
      return { ...state, buffered: action.b };
    case "SET_VOLUME": {
      const v = Math.min(1, Math.max(0, action.v));
      return { ...state, volume: v, muted: v === 0 ? state.muted : false };
    }
    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted };
    case "SET_RATE":
      return { ...state, rate: action.r };
    case "NEXT": {
      if (state.queue.length === 0) return state;
      const i = (state.currentIndex + 1) % state.queue.length;
      return { ...state, currentIndex: i, currentTime: 0, isPlaying: true };
    }
    case "PREV": {
      if (state.queue.length === 0) return state;
      const i =
        state.currentTime > 3
          ? state.currentIndex
          : (state.currentIndex - 1 + state.queue.length) %
            state.queue.length;
      return { ...state, currentIndex: i, currentTime: 0, isPlaying: true };
    }
    case "SET_MODE":
      return { ...state, mode: action.m };
    case "TOGGLE_PLAYLIST":
      return { ...state, showPlaylist: !state.showPlaylist };
    case "ENDED": {
      if (state.queue.length === 0) return { ...state, isPlaying: false };
      const i = (state.currentIndex + 1) % state.queue.length;
      return { ...state, currentIndex: i, currentTime: 0, isPlaying: true };
    }
    case "PUSH_HISTORY": {
      const hist = [
        action.item,
        ...state.history.filter((h) => h.id !== action.item.id),
      ].slice(0, 20);
      return { ...state, history: hist };
    }
    case "SET_MINI_POS":
      return {
        ...state,
        floating: {
          ...state.floating,
          mini: { x: action.x, y: action.y, dock: action.dock },
        },
      };
    case "SET_BUBBLE_POS":
      return {
        ...state,
        floating: {
          ...state.floating,
          bubble: { x: action.x, y: action.y },
        },
      };
    default:
      return state;
  }
}

const MediaContext = createContext<MediaContextValue | null>(null);

export function useMedia(): MediaContextValue {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia 必须在 MediaProvider 内使用");
  return ctx;
}

export function MediaProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSrcRef = useRef<string | null>(null);
  const currentItemRef = useRef<MediaItem | null>(null);
  const pathname = usePathname();

  // 从版本化 storage 恢复浮动位置 + resize 边界钳制
  useEffect(() => {
    const apply = () => {
      const vp = { innerWidth: window.innerWidth, innerHeight: window.innerHeight };
      const mini = resolveMiniPosition(vp);
      dispatch({ type: "SET_MINI_POS", x: mini.x, y: mini.y, dock: mini.dock });

      const bubble = resolveBubblePosition(vp);
      dispatch({ type: "SET_BUBBLE_POS", x: bubble.x, y: bubble.y });
    };
    apply();

    const onResize = () => {
      const vp = { innerWidth: window.innerWidth, innerHeight: window.innerHeight };
      const mini = resolveMiniPosition(vp);
      dispatch({ type: "SET_MINI_POS", x: mini.x, y: mini.y, dock: mini.dock });
      const bubble = resolveBubblePosition(vp);
      dispatch({ type: "SET_BUBBLE_POS", x: bubble.x, y: bubble.y });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const currentItem = state.queue[state.currentIndex] ?? null;
  currentItemRef.current = currentItem;

  // 返回当前激活元素：依赖 ref，确保 seek 不会被首次渲染闭包冻结
  const activeEl = useCallback((): HTMLMediaElement | null => {
    return audioRef.current;
  }, []);

  // —— 媒体元素事件 → dispatch ——
  const reportTime = useCallback(
    (t: number) => dispatch({ type: "SET_TIME", t }),
    [],
  );
  const reportDuration = useCallback(
    (d: number) => dispatch({ type: "SET_DURATION", d }),
    [],
  );
  const reportBuffered = useCallback(
    (b: number) => dispatch({ type: "SET_BUFFERED", b }),
    [],
  );
  const reportEnded = useCallback(() => dispatch({ type: "ENDED" }), []);

  // —— 切换 item：设置 src 并重置进度 ——
  useEffect(() => {
    if (!currentItem) return;
    const el = activeEl();
    if (!el) return;
    if (lastSrcRef.current !== currentItem.src) {
      // 赋值 .src 会自动触发加载，无需再 load()（load() 与紧随的 play() 会竞态 AbortError）
      el.src = currentItem.src;
      lastSrcRef.current = currentItem.src;
    }
    dispatch({ type: "SET_TIME", t: 0 });
    dispatch({ type: "SET_DURATION", d: 0 });
    dispatch({ type: "SET_BUFFERED", b: 0 });
  }, [currentItem]);

  // —— 播放 / 暂停 ——
  useEffect(() => {
    if (!currentItem) return;
    const active = activeEl();
    if (!active) return;
    if (state.isPlaying) {
      active.play().catch(() => {
        // 自动播放被拦截（视频带声且手势未透传到 effect）：回退暂停态，
        // UI 诚实显示播放键，用户手动点一次即可起播
        dispatch({ type: "PAUSE" });
      });
    } else {
      active.pause();
    }
  }, [state.isPlaying, currentItem]);

  // —— 音量 / 静音 ——
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = state.volume;
    el.muted = state.muted;
  }, [state.volume, state.muted]);

  // —— 倍速 ——
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = state.rate;
  }, [state.rate]);

  // —— 路由切换：离开媒体页时 expanded 缩为 mini（不强制 bubble，用户主动选择）——
  const isMediaPage = pathname.startsWith("/media");
  useEffect(() => {
    if (!isMediaPage && state.mode === "expanded") {
      dispatch({ type: "SET_MODE", m: "mini" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // —— 公开操作 ——
  const playItem = useCallback(
    (item: MediaItem, queue?: MediaItem[]) => {
      const q = queue ?? [item];
      const index = Math.max(0, q.findIndex((i) => i.id === item.id));
      dispatch({ type: "LOAD", queue: q, index });
      dispatch({ type: "PUSH_HISTORY", item });
      dispatch({ type: "SET_MODE", m: "mini" });
      dispatch({ type: "PLAY" });
    },
    [],
  );

  const playQueue = useCallback((items: MediaItem[], startIndex = 0) => {
    const item = items[startIndex];
    if (!item) return;
    dispatch({ type: "LOAD", queue: items, index: startIndex });
    dispatch({ type: "PUSH_HISTORY", item });
    dispatch({ type: "SET_MODE", m: "mini" });
    dispatch({ type: "PLAY" });
  }, []);

  const toggle = useCallback(
    () => dispatch({ type: state.isPlaying ? "PAUSE" : "PLAY" }),
    [state.isPlaying],
  );
  const play = useCallback(() => dispatch({ type: "PLAY" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);

  const seek = useCallback(
    (t: number) => {
      const el = activeEl();
      if (el) el.currentTime = t;
      dispatch({ type: "SET_TIME", t });
    },
    [activeEl],
  );
  const seekBy = useCallback(
    (delta: number) => {
      const el = activeEl();
      if (!el) return;
      const target = Math.min(
        el.duration || el.currentTime,
        Math.max(0, el.currentTime + delta),
      );
      el.currentTime = target;
      dispatch({ type: "SET_TIME", t: target });
    },
    [activeEl],
  );
  const prev = useCallback(() => dispatch({ type: "PREV" }), []);
  const setVolume = useCallback(
    (v: number) => dispatch({ type: "SET_VOLUME", v }),
    [],
  );
  const toggleMute = useCallback(() => dispatch({ type: "TOGGLE_MUTE" }), []);
  const cycleRate = useCallback(() => {
    const i = RATES.indexOf(state.rate);
    const r = RATES[(i + 1) % RATES.length];
    dispatch({ type: "SET_RATE", r });
  }, [state.rate]);
  const setMode = useCallback(
    (m: PlayerMode) => dispatch({ type: "SET_MODE", m }),
    [],
  );
  const setMiniPos = useCallback(
    (x: number, y: number, dock: "left" | "center" | "right") => {
      dispatch({ type: "SET_MINI_POS", x, y, dock });
      setMiniLayout({ version: 1, dock });
    },
    [],
  );
  const setBubblePos = useCallback(
    (x: number, y: number) => {
      dispatch({ type: "SET_BUBBLE_POS", x, y });
      saveBubblePosition(x, y);
    },
    [],
  );

  const togglePlaylist = useCallback(
    () => dispatch({ type: "TOGGLE_PLAYLIST" }),
    [],
  );

  // —— Media Session API（注册一次，引用稳定的 seek / seekBy）——
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    const ms = navigator.mediaSession;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => dispatch({ type: "PLAY" })],
      ["pause", () => dispatch({ type: "PAUSE" })],
      ["previoustrack", () => dispatch({ type: "PREV" })],
      ["nexttrack", () => dispatch({ type: "NEXT" })],
      ["seekbackward", (d) => seekBy(-(d?.seekOffset ?? 10))],
      ["seekforward", (d) => seekBy(d?.seekOffset ?? 10)],
      ["seekto", (d) => d?.seekTime != null && seek(d.seekTime)],
    ];
    handlers.forEach(([action, handler]) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* 不支持的 action 忽略 */
      }
    });

    return () => {
      handlers.forEach(([action]) => {
        try {
          ms.setActionHandler(action, null);
        } catch {
          /* ignore */
        }
      });
    };
  }, []);

  // —— 元数据 / 播放状态 / 进度同步 ——
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    const ms = navigator.mediaSession;
    if (currentItem) {
      try {
        ms.metadata = new MediaMetadata({
          title: currentItem.title,
          artist: currentItem.artist,
          album: currentItem.album ?? "阿鲲の小窝",
          artwork: [
            { src: resolveCover(currentItem), sizes: "512x512", type: "image/jpeg" },
          ],
        });
      } catch {
        /* ignore */
      }
    }
    ms.playbackState = state.isPlaying ? "playing" : "paused";
    if (state.duration > 0) {
      try {
        ms.setPositionState({
          duration: state.duration,
          position: Math.min(state.currentTime, state.duration),
          playbackRate: state.rate,
        });
      } catch {
        /* ignore */
      }
    }
  }, [currentItem, state.isPlaying, state.currentTime, state.duration, state.rate]);

  const ctxValue: MediaContextValue = {
    ...state,
    currentItem,
    playItem,
    playQueue,
    toggle,
    play,
    pause,
    next,
    prev,
    seek,
    seekBy,
    setVolume,
    toggleMute,
    cycleRate,
    setMode,
    setMiniPos,
    setBubblePos,
    togglePlaylist,
    reportTime,
    reportDuration,
    reportBuffered,
    reportEnded,
  };

  return (
    <MediaContext.Provider value={ctxValue}>
      {children}

      {/* 隐藏的音频播放引擎（始终挂载，跨路由保活） */}
      <AudioSurface
        audioRef={audioRef}
        onTimeUpdate={reportTime}
        onDuration={reportDuration}
        onBuffered={reportBuffered}
        onEnded={reportEnded}
      />

      {/* 全局 UI */}
      <FloatingPlayer />
      {state.showPlaylist && <Playlist />}
    </MediaContext.Provider>
  );
}
