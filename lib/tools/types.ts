// lib/tools/types.ts
// -----------------------------------------------------------------------------
// 工具页渲染数据类型定义（纯类型，客户端可用，经 index.ts re-export）。
// 区分于 lib/bili/types.ts（那是 B 站 API 响应原始类型）和 Supabase 行类型。
// 这里定义的是工具页 Server Component 消费的、经过聚合/裁剪后的渲染数据。
// -----------------------------------------------------------------------------

import type {
  BiliRelationStat,
  BiliUpCard,
  BiliUpInfo,
  BiliVideoItem,
  VideoStatus,
} from '@/lib/bili/types';
import type {
  FinanceCompany,
  FinanceQuarterly,
  FinanceSegment,
} from './finance-data';

/** UP 主详情页渲染数据（Server Component 消费，含降级标记） */
export interface UpDetailPageData {
  info: BiliUpInfo;
  stat: BiliRelationStat;
  card: BiliUpCard;
  videos: BiliVideoItem[];
  videoTotal: number;
  videoStatus: VideoStatus;
}

/** 公司详情页渲染数据 */
export interface CompanyDetailPageData {
  company: FinanceCompany;
  segments: FinanceSegment[];
  quarterly: FinanceQuarterly[];
}

/** 公司列表行渲染数据（列表页表格用） */
export interface CompanyListRow {
  code: string;
  name: string;
  market: string;
  gameRevenue: number;
  yoyGrowth: number;
  ratio: number;
  period: string;
}

/** 工具卡片入口项（工具入口页用） */
export interface ToolCard {
  title: string;
  description: string;
  href: string;
  icon: string;
}

/** 视频统计查询结果（内嵌组件消费） */
export interface VideoStatResult {
  bvid: string;
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
  degraded: boolean;
}
