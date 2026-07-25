"use client";

import { useEffect, useRef, useState } from "react";

interface TagWallProps {
  tags: string[];
  className?: string;
}

// 确定性伪随机（mulberry32），可顺序抽取多个值
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 按 tag 数量均匀铺满色相环 → 每个 tag 独立色号
function tagHue(i: number, total: number): string {
  const hue = Math.round((360 / total) * i);
  return `hsl(${hue}, 75%, 65%)`;
}

// 长度感知半径（百分比，相对容器宽）：与容器宽度无关，仅按字符数估算
function estimateRadius(tag: string): number {
  const len = [...tag].length;
  return Math.min(20, Math.max(7, len * 1.6));
}

// 带约束布局：泊松磁盘采样 + 安全区 + 长标签优先
// - 长标签先放、占更大最小间距 → 不重叠（含长标签）
// - 候选点限制在安全区内 → 不贴边
// - 全程百分比 + 种子随机 → 不依赖 containerWidth，resize 不抖
function generateLayout(tags: string[], seed: number): { x: number; y: number }[] {
  const rnd = mulberry32(seed);
  const xMin = 15, xMax = 85, yMin = 12, yMax = 88; // 安全区
  const gap = 4;

  // 长标签优先，留给它们更多空间
  const ordered = tags
    .map((t, i) => ({ t, i, r: estimateRadius(t) }))
    .sort((a, b) => b.r - a.r);

  const placed: { x: number; y: number; r: number }[] = [];
  const result: { x: number; y: number }[] = new Array(tags.length);

  for (const { t: _t, i, r } of ordered) {
    let chosen: { x: number; y: number } | null = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = xMin + rnd() * (xMax - xMin);
      const y = yMin + rnd() * (yMax - yMin);
      const ok = placed.every(
        (p) => Math.hypot(x - p.x, y - p.y) >= r + p.r + gap
      );
      if (ok) {
        chosen = { x, y };
        break;
      }
    }
    // 退化兜底：极端拥挤时随机落点（极少触发）
    if (!chosen) {
      chosen = {
        x: xMin + rnd() * (xMax - xMin),
        y: yMin + rnd() * (yMax - yMin),
      };
    }
    placed.push({ x: chosen.x, y: chosen.y, r });
    result[i] = chosen; // 映射回原始 index
  }
  return result;
}

interface TagItem {
  text: string;
  color: string;
  size: string;
  pos: { top: string; left: string };
}

export default function TagWall({ tags, className }: TagWallProps) {
  const [items, setItems] = useState<TagItem[]>([]);

  // 每次加载一个新 seed，本次生命周期固定（不随 resize / re-render 变）
  const seedRef = useRef<number | undefined>(undefined);
  if (seedRef.current === undefined) seedRef.current = Math.random();
  const seed = seedRef.current;

  useEffect(() => {
    const layout = generateLayout(tags, seed);
    const target: TagItem[] = layout.map((p, i) => {
      const r = estimateRadius(tags[i]);
      const size = r > 14 ? "text-sm" : r > 9 ? "text-base" : "text-lg";
      return {
        text: tags[i],
        color: tagHue(i, tags.length),
        size,
        pos: { left: `${p.x}%`, top: `${p.y}%` },
      };
    });

    // 起始：散乱抛出，下一帧过渡到目标 → 位移洗牌动画
    const start = target.map((t) => ({
      ...t,
      pos: {
        left: `${8 + Math.random() * 84}%`,
        top: `${8 + Math.random() * 84}%`,
      },
    }));

    setItems(start);
    const timer = setTimeout(() => setItems(target), 60);

    return () => clearTimeout(timer);
    // seed 稳定，仅 tags 变化时重排；resize 不触发
  }, [tags, seed]);

  return (
    <div
      aria-hidden="true"
      className={`relative w-full h-64 overflow-hidden ${className || ""}`}
    >
      {items.map((t, i) => (
        <div
          key={i}
          className="absolute transition-[top,left] duration-700 ease-out hover:scale-110"
          style={{
            top: t.pos.top,
            left: t.pos.left,
            transform: "translate(-50%, 0)",
          }}
        >
          <span
            className={`${t.size} whitespace-nowrap font-medium`}
            style={{ color: t.color }}
          >
            {t.text}
          </span>
        </div>
      ))}
    </div>
  );
}
