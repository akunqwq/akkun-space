"use client";

import { useEffect, useState, useRef } from "react";

interface TagWallProps {
  tags: string[];
  className?: string;
}

const tagColors = [
  "text-sky-500",
  "text-blue-500",
  "text-indigo-500",
  "text-violet-500",
  "text-purple-500",
  "text-fuchsia-500",
  "text-cyan-500",
  "text-blue-400",
  "text-indigo-400",
  "text-violet-400",
];

// 响应式网格分布，根据屏幕宽度调整列数
function generateResponsiveGridPoints(count: number, containerWidth: number): { x: number; y: number }[] {
  const padding = 8;
  const points: { x: number; y: number }[] = [];
  
  // 根据容器宽度动态调整列数
  let cols: number;
  if (containerWidth < 400) {
    cols = Math.min(3, count); // 小屏幕最多3列
  } else if (containerWidth < 600) {
    cols = Math.min(4, count); // 中屏幕最多4列
  } else if (containerWidth < 800) {
    cols = Math.min(5, count); // 大屏幕最多5列
  } else {
    cols = Math.min(6, count); // 超大屏幕最多6列
  }
  
  const rows = Math.ceil(count / cols);
  
  const cellWidth = (100 - padding * 2) / cols;
  const cellHeight = (100 - padding * 2) / rows;
  
  // 生成网格点，减少随机偏移范围
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    // 网格中心点 + 很小的随机偏移
    const x = padding + cellWidth * (col + 0.5) + (Math.random() - 0.5) * cellWidth * 0.1;
    const y = padding + cellHeight * (row + 0.5) + (Math.random() - 0.5) * cellHeight * 0.1;
    
    points.push({ x, y });
  }
  
  return points;
}

interface TagItem {
  text: string;
  color: string;
  size: string;
  pos: { top: string; left: string };
}

export default function TagWall({ tags, className }: TagWallProps) {
  const [items, setItems] = useState<TagItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    // 随机打乱标签顺序，确保每次布局不同
    const shuffledTags = [...tags].sort(() => Math.random() - 0.5);
    const points = generateResponsiveGridPoints(tags.length, containerWidth);

    const mapped = shuffledTags.map((tag, i) => {
      const color = tagColors[Math.floor(Math.random() * tagColors.length)];
      const sizeList = ["text-sm", "text-base", "text-lg"];
      const size = sizeList[Math.floor(Math.random() * sizeList.length)];

      return {
        text: tag,
        color,
        size,
        pos: {
          top: `${points[i].y}%`,
          left: `${points[i].x}%`,
        },
      };
    });

    setItems(mapped);
  }, [tags, containerWidth]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-64 overflow-hidden ${className || ""}`}
    >
      {items.map((t, i) => (
        <div
          key={i}
          className="absolute transition-all duration-300 hover:scale-110"
          style={{
            top: t.pos.top,
            left: t.pos.left,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span className={`${t.color} ${t.size} whitespace-nowrap font-medium`}>
            {t.text}
          </span>
        </div>
      ))}
    </div>
  );
}
