// GlobalHero 静态文案单一数据源：data/site/hero.json
// channels：每个频道聚合「首页 Lobby 文案(home)」与「子页面单页文案(page)」，
//          以及共享的 key / prefix（路由前缀匹配）/ href / image。
//          home 缺失 → 不上首页大堂；page 缺失 → 该路由走 fallback。
// fallback：未知路由兜底。
// 新增频道（如 gallery）只需在此对象的对应 key 下补 home/page，首页与子页一次性维护。

import heroData from "@/data/site/hero.json";

export interface HeroHomeDef {
  label: string; // 频道名（首页 Tab + 页面 H1 共用）
  eyebrow: string; // 频道定位（小标签）
  title: string; // 首页用：一句吸引人的话
  desc: string; // 一句解释
}

export interface HeroPageDef {
  eyebrow: string; // 频道定位
  title: string; // 频道名（页面标题）
  desc: string; // 一句解释
}

export interface HeroChannelDef {
  key: string;
  prefix: string; // 子页面路由前缀（pathname.startsWith 匹配）
  href: string; // 频道/页面跳转
  image: string; // 背景图
  home?: HeroHomeDef; // 首页大堂轮播
  page?: HeroPageDef; // 子页面单页 Hero
}

export interface RouteHeroDef {
  eyebrow: string;
  title: string;
  desc: string;
  href: string;
  image: string;
}

type HeroData = {
  channels: Record<string, HeroChannelDef>;
  fallback: RouteHeroDef;
};

const data = heroData as unknown as HeroData;

// 首页大堂的 Lobby 频道：仅取含 home 的频道，按 JSON 定义顺序，
// 扁平化为 {key,label,eyebrow,title,desc,href,image}，供 layout 注入 featured 后传给 GlobalHero。
export interface LobbyChannelDef {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  desc: string;
  href: string;
  image: string;
}

export const heroChannels: LobbyChannelDef[] = Object.values(data.channels)
  .filter((c): c is HeroChannelDef & { home: HeroHomeDef } => Boolean(c.home))
  .map((c) => ({
    key: c.key,
    href: c.href,
    image: c.image,
    label: c.home.label,
    eyebrow: c.home.eyebrow,
    title: c.home.title,
    desc: c.home.desc,
  }));

// 路由感知的单页 Hero：按 prefix 匹配频道，返回 page 文案 + 共享 href/image；未命中走 fallback。
export function getRouteHero(pathname: string): RouteHeroDef {
  const channel = Object.values(data.channels).find(
    (c) => c.page && pathname.startsWith(c.prefix)
  );
  if (channel?.page) {
    return {
      eyebrow: channel.page.eyebrow,
      title: channel.page.title,
      desc: channel.page.desc,
      href: channel.href,
      image: channel.image,
    };
  }
  return data.fallback;
}
