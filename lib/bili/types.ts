// lib/bili/types.ts
// -----------------------------------------------------------------------------
// B 站 API 响应类型定义（纯类型，客户端可用，经 index.ts re-export）。
// 所有类型严格贴合 bilibili-api-collect 社区文档字段，禁止类型欺骗。
// -----------------------------------------------------------------------------

/** UP 主直播间信息（acc/info 响应 live_room 字段） */
export interface LiveRoomInfo {
  roomStatus: number;
  liveStatus: number;
  url: string;
  title: string;
  cover: string;
  roomid: number;
}

/** UP 主基本信息（/x/space/wbi/acc/info 响应 data 字段精选） */
export interface BiliUpInfo {
  mid: number;
  name: string;
  face: string;
  sign: string;
  level: number;
  official_verify: boolean;
  vip_type: number;
  vip_status: number;
  live_room: LiveRoomInfo;
}

/** UP 主关注/粉丝统计（/x/relation/stat 响应 data 字段） */
export interface BiliRelationStat {
  mid: number;
  following: number;
  follower: number;
  whisper: number;
}

/** UP 主卡片信息（/x/web-interface/card 响应子集，含降级兜底所需字段） */
export interface UpCardInfo {
  mid: string;
  name: string;
  face: string;
  sign: string;
  level: number;
  official_verify: boolean;
  vip_type: number;
  fans: number;
  attention: number;
  /** 投稿视频数：位于响应 data 层级（非 data.card），见 fetchUpCard */
  archive_count: number;
  article_count: number;
}

/** UP 主卡片响应外壳 */
export interface BiliUpCard {
  card: UpCardInfo;
  following: boolean;
}

/** UP 主投稿视频条目（/x/space/wbi/arc/search 响应 vlist 单条） */
export interface BiliVideoItem {
  bvid: string;
  aid: number;
  title: string;
  play: number;
  video_review: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
  created: number;
  length: string;
  pic: string;
}

/** 分区聚合条目（tlist value） */
export interface TlistItem {
  tid: number;
  count: number;
  name: string;
}

/** 分页信息 */
export interface PageInfo {
  pn: number;
  ps: number;
  count: number;
}

/** 投稿视频列表数据体 */
export interface VideoListData {
  vlist: BiliVideoItem[];
  tlist: Record<string, TlistItem>;
  page: PageInfo;
}

/** 投稿视频列表响应外壳 */
export interface BiliVideoListResponse {
  list: VideoListData;
}

/** 单视频统计（/x/web-interface/view 响应 stat 字段） */
export interface BiliVideoStat {
  bvid: string;
  aid: number;
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
  now_rank: number;
  his_rank: number;
}

/** B 站 API 统一响应外壳 */
export interface BiliApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** WBI 签名结果 */
export interface WbiSignResult {
  w_rid: string;
  wts: number;
}

/** 缓存结果包装：data 必填，degraded 标记是否为降级数据 */
export interface CacheResult<T> {
  data: T;
  degraded: boolean;
  cachedAt: number;
}

/** 投稿视频列表获取状态（stale-while-revalidate + 熔断降级语义） */
export type VideoStatus = 'fresh' | 'stale' | 'unavailable';

/** 投稿视频列表获取结果：拆分 videos 与状态，供 UI 区分 新鲜/陈旧/不可用 */
export interface VideoListResult {
  videos: BiliVideoItem[];
  videoTotal: number;
  status: VideoStatus;
  cachedAt: number;
}

/** UP 主详情合并结果（acc/info + relation/stat + card） */
export interface UpInfoResult {
  info: BiliUpInfo;
  stat: BiliRelationStat;
  card: BiliUpCard;
  degraded: boolean;
  cachedAt: number;
}

/** UP 主详情页渲染数据（Server Component 消费） */
export interface UpDetailPageData {
  info: BiliUpInfo;
  stat: BiliRelationStat;
  card: BiliUpCard;
  videos: BiliVideoItem[];
  videoTotal: number;
  videoStatus: VideoStatus;
}

/** Supabase bili_up_snapshots 行类型 */
export interface BiliUpSnapshot {
  id: string;
  mid: number;
  follower_count: number;
  following_count: number;
  sampled_at: string;
  created_at: string;
}

/** Supabase bili_up_tracked 行类型 */
export interface BiliUpTracked {
  mid: number;
  name: string;
  last_queried_at: string;
  created_at: string;
}
