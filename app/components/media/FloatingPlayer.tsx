"use client";

import { useMedia } from "./MediaProvider";
import MiniPlayer from "./MiniPlayer";
import MediaPlayer from "./MediaPlayer";
import BubblePlayer from "./BubblePlayer";

/**
 * 全局媒体 UI 总调度：
 * - hidden  → 不渲染
 * - bubble  → 悬浮球（博客全局可见，可拖动）
 * - mini    → 桌面底栏（紧凑控制条）
 * - expanded → 全屏展开（音频封面 / 视频播放）
 */
export default function FloatingPlayer() {
  const m = useMedia();

  if (m.mode === "hidden") return null;
  if (m.mode === "bubble") return <BubblePlayer />;
  if (m.mode === "mini") return <MiniPlayer />;
  if (m.mode === "expanded") return <MediaPlayer />;

  return null;
}
