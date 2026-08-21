// 站点路由单一数据源：data/site/nav.json
import navData from "@/data/site/nav.json";

export interface NavItem {
  label: string;
  href: string;
  inNav: boolean; // 是否出现在 Header 导航（如 /music 进导航，其余频道同理）
  sitemap: {
    changeFrequency: string;
    priority: number;
  };
}

export const navItems: NavItem[] = navData as NavItem[];

// Header 导航项（按 JSON 顺序）
export const headerNav: NavItem[] = navItems.filter((i) => i.inNav);
