// 文章类型
import postTypesData from "@/data/content/post-types.json";

// tech=技术  tinker=折腾  essay=随笔  news=资讯存档
export type PostType = "tech" | "tinker" | "essay" | "news";

export interface PostTypeDef {
  key: PostType;
  label: string;
  badgeClass: string; // 类型徽章配色（暗/亮主题通用）
}

export const POST_TYPES: PostTypeDef[] = postTypesData as PostTypeDef[];

export const VALID_TYPES: PostType[] = POST_TYPES.map((t) => t.key);

export const POST_TYPE_LABELS: Record<PostType, string> = Object.fromEntries(
  POST_TYPES.map((t) => [t.key, t.label])
) as Record<PostType, string>;

export const TYPE_BADGE_STYLES: Record<PostType, string> = Object.fromEntries(
  POST_TYPES.map((t) => [t.key, t.badgeClass])
) as Record<PostType, string>;

// 归一化 type：非法/缺失时默认归为 essay（个人随笔，避免被误隐藏）
export function normalizePostType(type: unknown): PostType {
  return VALID_TYPES.includes(type as PostType) ? (type as PostType) : "essay";
}
