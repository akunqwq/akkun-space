"use client";

import { useState } from "react";
import type { MediaItem } from "@/lib/media";
import { resolveCover } from "@/lib/media";

// 封面图：优先 item.cover，否则按 src 同名 .jpg 解析；都失败回退默认封面。
export default function CoverImage({
  item,
  className,
  loading,
  style,
  ...rest
}: {
  item: MediaItem;
  className?: string;
  loading?: "lazy" | "eager";
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLImageElement>) {
  const [errored, setErrored] = useState(false);
  const src = errored ? "/media/default-cover.svg" : resolveCover(item);
  return (
    <img
      src={src}
      alt={item.title}
      className={className}
      style={style}
      loading={loading}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
