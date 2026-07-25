/**
 * 媒体播放器布局持久化（版本化 Schema）
 *
 * 设计原则：
 * - version 字段保证 schema 变更向后兼容
 * - dock + 独立坐标分离：dock 控制吸附锚点，customOffset 预留自由拖拽扩展
 * - clampPosition 保证跨设备/响应式边界安全
 */

const STORAGE_KEY_MINI = "media-player-layout-v1";
const STORAGE_KEY_BUBBLE = "media-player-orb-v1";

export type Dock = "left" | "center" | "right";

export interface PlayerLayoutStorageV1 {
  version: 1;
  dock: Dock;
  /** 预留：相对 dock 锚点的偏移（未来自由拖拽用） */
  customOffset?: { x: number; y: number };
}

// ---- 默认值 ----

const DEFAULT_MINI_LAYOUT: PlayerLayoutStorageV1 = {
  version: 1,
  dock: "center",
};

/** 提供窗口尺寸的 getter（SSR 安全） */
type Viewport = { innerWidth: number; innerHeight: number };

export function resolveMiniPosition(vp: Viewport): { x: number; y: number; dock: Dock } {
  const dock = getMiniLayout().dock;
  const y = vp.innerHeight - 72 - 24;
  const x = snapX(dock, 340, vp.innerWidth);
  return { x, y, dock };
}

export function resolveBubblePosition(vp: Viewport): { x: number; y: number } {
  const raw = loadRaw<{ x: number; y: number }>(STORAGE_KEY_BUBBLE);
  if (raw?.x != null && raw?.y != null) {
    return clampPosition(raw.x, raw.y, 56, 56, vp);
  }
  const orbSize = 56;
  return {
    x: vp.innerWidth - orbSize - 20,
    y: vp.innerHeight - orbSize - 100,
  };
}

// ---- 读取 / 写入 ----

function loadRaw<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getMiniLayout(): PlayerLayoutStorageV1 {
  const raw = loadRaw<PlayerLayoutStorageV1>(STORAGE_KEY_MINI);
  if (
    raw?.version === 1 &&
    ["left", "center", "right"].includes(raw.dock)
  ) {
    return raw;
  }
  return { ...DEFAULT_MINI_LAYOUT };
}

export function setMiniLayout(layout: PlayerLayoutStorageV1): void {
  try {
    localStorage.setItem(STORAGE_KEY_MINI, JSON.stringify(layout));
  } catch { /* quota exceeded — silently degrade */ }
}

export function saveBubblePosition(x: number, y: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_BUBBLE, JSON.stringify({ x, y }));
  } catch { /* ignore */ }
}

// ---- 工具函数 ----

/** 根据 dock 和卡片宽度计算吸附 X 坐标 */
export function snapX(dock: Dock, cardWidth: number, viewportWidth: number): number {
  const padding = 16;
  switch (dock) {
    case "left":
      return padding;
    case "right":
      return viewportWidth - cardWidth - padding;
    case "center":
      return (viewportWidth - cardWidth) / 2;
  }
}

/**
 * 视口边界钳制 — 保证组件不超出可视区域
 * 调用时机：初始化恢复 / window.resize / 手动拖动结束
 */
export function clampPosition(
  x: number,
  y: number,
  w: number,
  h: number,
  vp: Viewport = window,
): { x: number; y: number } {
  const pad = 16;
  return {
    x: Math.max(pad, Math.min(x, vp.innerWidth - w - pad)),
    y: Math.max(pad, Math.min(y, vp.innerHeight - h - pad)),
  };
}

/**
 * 三区 dock 判定（拖动松手时调用）
 * 卡片中心 < 35% → left，> 65% → right，否则 → center
 */
export function classifyDock(cardCenterX: number, viewportWidth: number): Dock {
  const ratio = cardCenterX / viewportWidth;
  if (ratio < 0.35) return "left";
  if (ratio > 0.65) return "right";
  return "center";
}
