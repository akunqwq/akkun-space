// 游戏收藏数据层 数据源：data/content/games.json（本文件保留类型定义与状态映射）
// covers 当前为占位图（public/images/genshin/*），部署时替换为正式海报。

import gamesData from "@/data/content/games.json";

// 游玩状态枚举
export type GameStatus =
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "favorite"
  | "abandoned";

export interface GameItem {
  id: string;
  title: string;
  cover?: string; // 竖版海报路径
  platform: string; // 平台：PC · 移动端 / Steam / Epic / Android / Web
  source?: string; // 厂商：HoYoverse / 鹰角网络 ...
  genres: string[]; // 标签：开放世界 / RPG / ACT ...
  status?: GameStatus; // 游玩状态
  // 后续可扩展字段
  favorite?: boolean;
  completed?: boolean;
  rating?: number;
  playTime?: string;
  links?: { label: string; url: string }[];
}

// 状态枚举 → 中文展示标签（首页精选 meta / 卡片角标共用）
export const STATUS_LABELS: Record<GameStatus, string> = {
  playing: "在玩",
  completed: "已通关",
  backlog: "待玩",
  wishlist: "想玩",
  favorite: "最爱",
  abandoned: "弃坑",
};

export const gameItems: GameItem[] = gamesData as GameItem[];
