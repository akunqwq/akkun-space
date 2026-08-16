// 个人社交账号数据源：data/site/socials.json
import socialsData from "@/data/site/socials.json";

export interface Social {
  key: string; // bilibili / github / qq / blog
  label: string;
  href?: string; // 无 href（如 QQ）表示纯展示、不可点击
  handle?: string; // 展示用 ID / 昵称
  emoji?: string;
  title?: string; // hover 提示
  desc?: string; // 首页「关注我」卡片可选副标语
}

export const socials: Social[] = socialsData as Social[];

export function getSocial(key: string): Social | undefined {
  return socials.find((s) => s.key === key);
}

// JSON-LD sameAs：仅取有外链的个人账号（排除 blog 本站 / repo 本站源码）
export const socialUrls: string[] = socials
  .filter((s) => s.href && s.key !== "blog" && s.key !== "repo")
  .map((s) => s.href!);
