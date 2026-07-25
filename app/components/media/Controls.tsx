"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  ListMusic,
  Minimize2,
} from "lucide-react";
import { useMedia } from "./MediaProvider";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import { formatTime } from "./utils";

export default function Controls() {
  const m = useMedia();

  const iconBtn =
    "flex items-center justify-center w-9 h-9 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors";

  return (
    <div className="flex flex-col gap-2 text-white select-none">
      {/* 进度条 */}
      <ProgressBar />

      {/* 时间码 */}
      <div className="flex items-center justify-between font-mono text-xs tabular-nums text-white/70 px-1">
        <span>{formatTime(m.currentTime)}</span>
        <span>{formatTime(m.duration)}</span>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-between gap-1 px-1">
        <div className="flex items-center gap-1">
          <button className={iconBtn} onClick={m.prev} title="上一首">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
            onClick={m.toggle}
            title={m.isPlaying ? "暂停" : "播放"}
          >
            {m.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          <button className={iconBtn} onClick={m.next} title="下一首">
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            className={iconBtn}
            onClick={() => m.seekBy(-10)}
            title="快退 10 秒"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            className={iconBtn}
            onClick={() => m.seekBy(10)}
            title="快进 10 秒"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <VolumeControl />
          <button
            className={`${iconBtn} font-mono text-xs w-auto px-2`}
            onClick={m.cycleRate}
            title="播放速度"
          >
            {m.rate}x
          </button>
          <button
            className={iconBtn}
            onClick={m.togglePlaylist}
            title="播放列表"
          >
            <ListMusic className="w-5 h-5" />
          </button>
          <button
            className={iconBtn}
            onClick={() => m.setMode("mini")}
            title="收起"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
