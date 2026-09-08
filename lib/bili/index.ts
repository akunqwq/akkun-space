// lib/bili/index.ts
// 聚合入口：只 re-export 纯类型（types.ts）。
// wbi.ts / cache.ts / client.ts 顶部带 'server-only'，严禁 re-export 到客户端 bundle。
// 调用方走子路径 @/lib/bili/wbi / @/lib/bili/cache / @/lib/bili/client 拿服务端能力。
// 遵循 verbatimModuleSyntax：纯类型 re-export 用 export type。
export type {
  BiliApiResponse,
  BiliRelationStat,
  BiliUpCard,
  BiliUpInfo,
  BiliUpSnapshot,
  BiliUpTracked,
  BiliVideoItem,
  BiliVideoListResponse,
  BiliVideoStat,
  CacheResult,
  LiveRoomInfo,
  PageInfo,
  TlistItem,
  UpCardInfo,
  UpDetailPageData,
  UpInfoResult,
  VideoListData,
  WbiSignResult,
} from './types';
