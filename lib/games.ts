// 游戏与 ACG 数据层 —— 供首页 Lobby 与 /games 页面使用。
// covers 当前为占位图（public/images/genshin/*），部署时可替换为正式素材。
// postSlug 指向 content/posts 中对应的游戏相关文章，使卡片可跳转到真实内容。

export interface GameItem {
  slug: string;
  name: string;
  cover?: string;
  note?: string;
  status?: string; // 在玩 / 关注 / 坑
  postSlug?: string; // 关联博客文章 slug（存在时卡片跳转该文章）
}

export const gameItems: GameItem[] = [
  {
    slug: "genshin",
    name: "原神",
    cover: "/images/genshin/gs_2026-01-22_000132_233.jpg",
    note: "提瓦特大陆 · 开放世界",
    status: "在玩",
    postSlug: "genshin-columbina-running",
  },
  {
    slug: "hsr",
    name: "崩坏：星穹铁道",
    cover: "/images/genshin/test-map1.jpg",
    note: "星穹列车 · 回合制 RPG",
    status: "在玩",
  },
  {
    slug: "arknights-endfield",
    name: "明日方舟：终末地",
    cover: "/images/genshin/test-map2.jpg",
    note: "全球公测现已开启",
    status: "关注",
    postSlug: "《明日方舟：终末地》全球公测现已开启！",
  },
  {
    slug: "mmd",
    name: "MMD / 同人",
    cover: "/images/genshin/talent.jpg",
    note: "折腾建模、渲染与二创",
    status: "坑",
  },
];
