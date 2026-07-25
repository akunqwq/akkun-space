"use client";

import { Volume2, Volume1, VolumeX } from "lucide-react";
import { useMedia } from "./MediaProvider";

export default function VolumeControl() {
  const m = useMedia();
  const Icon =
    m.muted || m.volume === 0
      ? VolumeX
      : m.volume < 0.5
        ? Volume1
        : Volume2;

  return (
    <div className="group flex items-center gap-1">
      <button
        className="flex items-center justify-center w-9 h-9 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
        onClick={m.toggleMute}
        title={m.muted ? "取消静音" : "静音"}
      >
        <Icon className="w-5 h-5" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={m.muted ? 0 : m.volume}
        onChange={(e) => m.setVolume(Number(e.target.value))}
        className="w-0 group-hover:w-20 transition-all duration-200 accent-[var(--accent)] cursor-pointer"
        title="音量"
        aria-label="音量"
      />
    </div>
  );
}
