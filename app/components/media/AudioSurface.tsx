"use client";

interface Props {
  audioRef: React.Ref<HTMLAudioElement>;
  onTimeUpdate: (t: number) => void;
  onDuration: (d: number) => void;
  onBuffered: (b: number) => void;
  onEnded: () => void;
}

// 音频播放引擎：始终挂载、不可见。跨路由保活靠 root layout 不卸载。
export default function AudioSurface({
  audioRef,
  onTimeUpdate,
  onDuration,
  onBuffered,
  onEnded,
}: Props) {
  return (
    <audio
      ref={audioRef}
      className="hidden"
      preload="metadata"
      controlsList="nodownload noplaybackrate"
      onContextMenu={(e) => e.preventDefault()}
      onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => onDuration(e.currentTarget.duration || 0)}
      onProgress={(e) => {
        const el = e.currentTarget;
        if (el.buffered.length)
          onBuffered(el.buffered.end(el.buffered.length - 1));
      }}
      onEnded={onEnded}
    />
  );
}
