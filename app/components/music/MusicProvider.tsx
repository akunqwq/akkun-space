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
import type { MusicItem } from "@/lib/music";
import { DEFAULT_COVER } from "@/lib/music";
import {
  getSignedMusicUrl,
  invalidateSignedMusicUrl,
} from "@/lib/music-url";
import type { MusicContextValue, MusicState, PlaybackState } from "./types";
import AudioSurface from "./AudioSurface";
import MusicBar from "./MusicBar";

const RATES = [0.5, 1, 1.25, 1.5, 2];

const initialState: MusicState = {
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  playbackState: "idle",
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  muted: false,
  rate: 1,
  minimized: false,
};

type Action =
  | { type: "LOAD"; queue: MusicItem[]; index: number }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SET_TIME"; t: number }
  | { type: "SET_DURATION"; d: number }
  | { type: "SET_BUFFERED"; b: number }
  | { type: "SET_VOLUME"; v: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_MINIMIZED"; v: boolean }
  | { type: "TOGGLE_MINIMIZE" }
  | { type: "SET_RATE"; r: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SET_PLAYING"; v: boolean }
  | { type: "SET_PLAYBACK_STATE"; s: PlaybackState }
  | { type: "SEEK"; t: number }
  | { type: "CLOSE" };

function reducer(state: MusicState, action: Action): MusicState {
  switch (action.type) {
    case "LOAD":
      return {
        ...state,
        queue: action.queue,
        currentIndex: action.index,
        isPlaying: false,
        playbackState: "idle",
        currentTime: 0,
        duration: 0,
        buffered: 0,
      };
    case "PLAY":
      // 意图播放：标记为 loading，等 playing 事件再转 playing
      return { ...state, isPlaying: true, playbackState: "loading" };
    case "PAUSE":
      return { ...state, isPlaying: false, playbackState: "paused" };
    case "SET_PLAYING":
      return {
        ...state,
        isPlaying: action.v,
        playbackState: action.v ? "loading" : "paused",
      };
    case "SET_PLAYBACK_STATE":
      return { ...state, playbackState: action.s };
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
    case "SET_MINIMIZED":
      return { ...state, minimized: action.v };
    case "TOGGLE_MINIMIZE":
      return { ...state, minimized: !state.minimized };
    case "SET_RATE":
      return { ...state, rate: action.r };
    case "NEXT": {
      if (state.queue.length === 0) return state;
      const i = (state.currentIndex + 1) % state.queue.length;
      return {
        ...state,
        currentIndex: i,
        currentTime: 0,
        isPlaying: true,
        playbackState: "loading",
      };
    }
    case "PREV": {
      if (state.queue.length === 0) return state;
      const i =
        state.currentTime > 3
          ? state.currentIndex
          : (state.currentIndex - 1 + state.queue.length) %
            state.queue.length;
      return {
        ...state,
        currentIndex: i,
        currentTime: 0,
        isPlaying: true,
        playbackState: "loading",
      };
    }
    case "SEEK":
      return { ...state, currentTime: action.t };
    case "CLOSE":
      return {
        ...state,
        queue: [],
        currentIndex: -1,
        isPlaying: false,
        playbackState: "idle",
        currentTime: 0,
        duration: 0,
        buffered: 0,
      };
    default:
      return state;
  }
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic 必须在 MusicProvider 内使用");
  return ctx;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentItemRef = useRef<MusicItem | null>(null);

  const currentItem = state.currentIndex >= 0 ? state.queue[state.currentIndex] ?? null : null;
  currentItemRef.current = currentItem;

  // —— refs：跨异步闭包读取最新状态，避免冻结 ——
  const isPlayingRef = useRef(state.isPlaying);
  isPlayingRef.current = state.isPlaying;
  const playbackStateRef = useRef(state.playbackState);
  playbackStateRef.current = state.playbackState;
  const currentKeyRef = useRef<string | null>(currentItem?.src ?? null);
  currentKeyRef.current = currentItem?.src ?? null;
  const loadedKeyRef = useRef<string | null>(null); // 已加载到 el.src 的存储 key
  const resignCountRef = useRef(0); // 连续重签次数（防 404/真错误死循环）

  // 依赖 ref，确保 seek 不会被首次渲染闭包冻结
  const activeEl = useCallback((): HTMLMediaElement | null => audioRef.current, []);

  const reportTime = useCallback((t: number) => dispatch({ type: "SET_TIME", t }), []);
  const reportDuration = useCallback((d: number) => dispatch({ type: "SET_DURATION", d }), []);
  const reportBuffered = useCallback((b: number) => dispatch({ type: "SET_BUFFERED", b }), []);
  const reportEnded = useCallback(() => {
    // 单曲播完 → 收起整个播放器（含悬浮球），需回音乐库重新点歌才会出现
    // 浏览器在 ended 时已自动暂停，直接清空队列使 currentItem 变 null，UI 整体不渲染
    dispatch({ type: "CLOSE" });
  }, []);

  // 换签名 URL + 播放（私有桶，src 是桶内对象路径）。同时驱动 loading→playing 过渡。
  const playActiveItem = useCallback(
    async (key: string) => {
      const el = activeEl();
      if (!el) return;
      dispatch({ type: "SET_PLAYBACK_STATE", s: "loading" });
      invalidateSignedMusicUrl(key);
      resignCountRef.current = 0; // 新曲目，重置重签计数
      let url: string;
      try {
        url = await getSignedMusicUrl(key);
      } catch {
        dispatch({ type: "SET_PLAYBACK_STATE", s: "error" });
        dispatch({ type: "SET_PLAYING", v: false });
        return;
      }
      if (currentKeyRef.current !== key) return; // 已切到别的歌
      el.src = url;
      loadedKeyRef.current = key;
      dispatch({ type: "SET_TIME", t: 0 });
      dispatch({ type: "SET_DURATION", d: 0 });
      dispatch({ type: "SET_BUFFERED", b: 0 });
      el.play().catch(() => dispatch({ type: "PAUSE" }));
    },
    [activeEl],
  );

  // 切歌 → 拉签名 URL、重置进度、按意图播放
  useEffect(() => {
    if (!currentItem) return;
    playActiveItem(currentItem.src);
  }, [currentItem, playActiveItem]);

  // 播放 / 暂停（src 已就绪时直接 play；未就绪由上面的 load effect 接管）
  useEffect(() => {
    if (!currentItem) return;
    const active = activeEl();
    if (!active) return;
    if (state.isPlaying) {
      if (loadedKeyRef.current === currentItem.src) {
        active.play().catch(() => dispatch({ type: "PAUSE" }));
      }
    } else {
      active.pause();
    }
  }, [state.isPlaying, currentItem, activeEl]);

  // 音量 / 静音
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = state.volume;
    el.muted = state.muted;
  }, [state.volume, state.muted]);

  // 最小化（悬浮窗）状态持久化
  const minimizedHydrated = useRef(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem("music-minimized");
      if (v === "1") dispatch({ type: "SET_MINIMIZED", v: true });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (!minimizedHydrated.current) {
      minimizedHydrated.current = true;
      return;
    }
    try {
      localStorage.setItem("music-minimized", state.minimized ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [state.minimized]);

  // 倍速
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = state.rate;
  }, [state.rate]);

  // —— 公开操作 ——
  const playItem = useCallback((item: MusicItem, queue?: MusicItem[]) => {
    const q = queue ?? [item];
    const index = Math.max(0, q.findIndex((i) => i.id === item.id));
    dispatch({ type: "LOAD", queue: q, index });
    dispatch({ type: "PLAY" });
  }, []);

  const playQueue = useCallback((items: MusicItem[], startIndex = 0) => {
    const item = items[startIndex];
    if (!item) return;
    dispatch({ type: "LOAD", queue: items, index: startIndex });
    dispatch({ type: "PLAY" });
  }, []);

  const toggle = useCallback(
    () => dispatch({ type: state.isPlaying ? "PAUSE" : "PLAY" }),
    [state.isPlaying],
  );
  const play = useCallback(() => dispatch({ type: "PLAY" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev = useCallback(() => dispatch({ type: "PREV" }), []);

  const seek = useCallback(
    (t: number) => {
      const el = activeEl();
      if (el) el.currentTime = t;
      dispatch({ type: "SEEK", t });
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
      dispatch({ type: "SEEK", t: target });
    },
    [activeEl],
  );
  const setVolume = useCallback((v: number) => dispatch({ type: "SET_VOLUME", v }), []);
  const toggleMute = useCallback(() => dispatch({ type: "TOGGLE_MUTE" }), []);
  const toggleMinimize = useCallback(() => dispatch({ type: "TOGGLE_MINIMIZE" }), []);
  const cycleRate = useCallback(() => {
    const i = RATES.indexOf(state.rate);
    const r = RATES[(i + 1) % RATES.length];
    dispatch({ type: "SET_RATE", r });
  }, [state.rate]);
  const close = useCallback(() => {
    const el = activeEl();
    if (el) el.pause();
    dispatch({ type: "CLOSE" });
  }, [activeEl]);

  // 失败后重试：重签 + 续播到原位置
  const retry = useCallback(() => {
    const item = currentItemRef.current;
    if (!item) return;
    dispatch({ type: "PLAY" }); // 标记 loading + 意图播放
    playActiveItem(item.src);
  }, [playActiveItem]);

  // 音频真正开始播放 → 重置重签计数（上一轮重签已成功）
  const reportPlaying = useCallback(() => {
    resignCountRef.current = 0;
  }, []);

  // 音频出错（签名 URL 过期 / 网络抖动）→ 失效缓存、重签、续播到原位置
  const reportError = useCallback(() => {
    const item = currentItemRef.current;
    const el = activeEl();
    if (!item || !el) return;
    // 连续失败保护：同一曲目重签 ≥2 次仍出错，放弃以免死循环
    if (resignCountRef.current >= 2) {
      dispatch({ type: "SET_PLAYBACK_STATE", s: "error" });
      dispatch({ type: "SET_PLAYING", v: false });
      return;
    }
    resignCountRef.current += 1;
    const key = item.src;
    const wasPlaying = isPlayingRef.current;
    const resumeAt = el.currentTime;
    invalidateSignedMusicUrl(key);
    dispatch({ type: "SET_PLAYBACK_STATE", s: "loading" });
    (async () => {
      let url: string;
      try {
        url = await getSignedMusicUrl(key);
      } catch {
        dispatch({ type: "SET_PLAYBACK_STATE", s: "error" });
        dispatch({ type: "SET_PLAYING", v: false });
        return;
      }
      if (currentKeyRef.current !== key) return;
      el.src = url;
      loadedKeyRef.current = key;
      const onMeta = () => {
        try {
          el.currentTime = resumeAt;
        } catch {
          /* ignore */
        }
        el.removeEventListener("loadedmetadata", onMeta);
        if (wasPlaying) el.play().catch(() => dispatch({ type: "PAUSE" }));
      };
      el.addEventListener("loadedmetadata", onMeta);
    })();
  }, [activeEl]);

  // —— Media Session API（系统媒体控制）——
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => dispatch({ type: "PLAY" })],
      ["pause", () => dispatch({ type: "PAUSE" })],
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

  // 元数据（含签名封面 artwork）—— 仅在切歌时设置
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!currentItem) return;
    const ms = navigator.mediaSession;
    let cancelled = false;
    (async () => {
      const artworkSrc = currentItem.cover
        ? await getSignedMusicUrl(currentItem.cover).catch(() => DEFAULT_COVER)
        : DEFAULT_COVER;
      if (cancelled) return;
      try {
        ms.metadata = new MediaMetadata({
          title: currentItem.title,
          artist: currentItem.artist,
          album: currentItem.album ?? "阿鲲の小窝",
          artwork: [{ src: artworkSrc, sizes: "512x512", type: "image/jpeg" }],
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentItem]);

  // 播放状态 / 进度同步
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.playbackState =
      state.playbackState === "playing" || state.playbackState === "buffering"
        ? "playing"
        : "paused";
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
  }, [state.playbackState, state.currentTime, state.duration, state.rate]);

  const ctxValue: MusicContextValue = {
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
    toggleMinimize,
    cycleRate,
    close,
    retry,
    reportTime,
    reportDuration,
    reportBuffered,
    reportEnded,
    reportError,
  };

  return (
    <MusicContext.Provider value={ctxValue}>
      {children}

      {/* 隐藏的音频播放引擎（始终挂载，跨路由保活） */}
      <AudioSurface
        audioRef={audioRef}
        onTimeUpdate={reportTime}
        onDuration={reportDuration}
        onBuffered={reportBuffered}
        onEnded={reportEnded}
        onError={reportError}
        onPlaying={() => {
          reportPlaying();
          dispatch({ type: "SET_PLAYBACK_STATE", s: "playing" });
        }}
        onWaiting={() => dispatch({ type: "SET_PLAYBACK_STATE", s: "buffering" })}
        onPause={() => {
          // ended / error 不应被 pause 事件回退
          if (
            playbackStateRef.current === "ended" ||
            playbackStateRef.current === "error"
          )
            return;
          dispatch({ type: "SET_PLAYBACK_STATE", s: "paused" });
        }}
      />

      {/* 全局常驻播放栏 */}
      <MusicBar />
    </MusicContext.Provider>
  );
}
