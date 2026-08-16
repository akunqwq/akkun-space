"use client";

import { useEffect, useState } from "react";
import type { MusicItem } from "@/lib/music";
import { DEFAULT_COVER } from "@/lib/music";
import { getSignedMusicUrl } from "@/lib/music-url";

// 封面图：从私有桶换签名 URL 显示；无 cover / 签名失败回退本地默认封面。
export default function CoverImage({
  item,
  className,
  loading,
  style,
  ...rest
}: {
  item: MusicItem;
  className?: string;
  loading?: "lazy" | "eager";
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLImageElement>) {
  const [src, setSrc] = useState<string>(DEFAULT_COVER);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setErrored(false);

    // 无封面 → 直接用本地默认
    if (!item.cover) {
      setSrc(DEFAULT_COVER);
      return;
    }

    // 先占位默认封面，签名返回后替换（缓存命中时近乎同步）
    setSrc(DEFAULT_COVER);
    getSignedMusicUrl(item.cover)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        /* 保持默认封面 */
      });

    return () => {
      cancelled = true;
    };
  }, [item.cover]);

  const finalSrc = errored ? DEFAULT_COVER : src;
  return (
    <img
      src={finalSrc}
      alt={item.title}
      className={className}
      style={style}
      loading={loading}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
