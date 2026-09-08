// lib/tools/finance-data.ts
// -----------------------------------------------------------------------------
// 12 家游戏公司静态配置（阿鲲 Q2 决策）。
// 客户端可用，经 index.ts re-export。
// 用途：
//   1. generateStaticParams 预热热门公司（阿鲲 U7：只预热头部 3-5 家）
//   2. 路由校验：[code] 动态参数只接受这 12 家之一（其他返回 404）
//   3. 公司列表页兜底数据（实际渲染从 Supabase 拉，但配置做兜底）
// -----------------------------------------------------------------------------
import type { CompanyListRow } from './types';

/** 市场：HK 港股 / US 美股 / A股 */
export type FinanceMarket = 'HK' | 'US' | 'A股';

/** 公司静态配置（不含财报数值，数值从 Supabase 拉） */
export interface FinanceCompanyConfig {
  code: string;
  name: string;
  market: FinanceMarket;
  /** 是否热门公司（阿鲲 U7：generateStaticParams 只预热热门公司） */
  featured: boolean;
}

/**
 * 12 家公司配置（阿鲲 Q2 拍板覆盖范围）。
 * 不变式：code 必须与 data/finance/companies.csv 的 code 列完全一致——
 * 路由校验（isValidCompanyCode）、generateStaticParams 预热、导入脚本共用同一份 code，
 * 否则详情页 404 / 数据落不到对应行。market 取值 HK / US / A股（CSV 用 A，导入脚本归一化为 A股）。
 */
export const FINANCE_COMPANIES: readonly FinanceCompanyConfig[] = [
  { code: '00700.HK', name: '腾讯控股', market: 'HK', featured: true },
  { code: 'NTES.US', name: '网易', market: 'US', featured: true },
  { code: '002555', name: '三七互娱', market: 'A股', featured: true },
  { code: '002602', name: '世纪华通', market: 'A股', featured: false },
  { code: '002624', name: '完美世界', market: 'A股', featured: false },
  { code: '603444', name: '吉比特', market: 'A股', featured: false },
  { code: '002558', name: '巨人网络', market: 'A股', featured: false },
  { code: '02400.HK', name: '心动公司', market: 'HK', featured: false },
  { code: '09626.HK', name: '哔哩哔哩', market: 'HK', featured: true },
  { code: '00302.HK', name: '中手游', market: 'HK', featured: false },
  { code: '09995.HK', name: '祖龙娱乐', market: 'HK', featured: false },
  { code: '07998.HK', name: 'IGG', market: 'HK', featured: false },
];

/** 热门公司（阿鲲 U7：generateStaticParams 只预热这些） */
export const FEATURED_COMPANIES: readonly FinanceCompanyConfig[] =
  FINANCE_COMPANIES.filter((c) => c.featured);

/** 校验 code 是否为已知公司 */
export function isValidCompanyCode(code: string): boolean {
  return FINANCE_COMPANIES.some((c) => c.code === code);
}

/** 按 code 查公司配置 */
export function getCompanyConfig(code: string): FinanceCompanyConfig | null {
  return FINANCE_COMPANIES.find((c) => c.code === code) ?? null;
}

/** Supabase finance_companies 行类型（运行时从 DB 拉的数值） */
export interface FinanceCompany {
  code: string;
  name: string;
  market: string;
  game_revenue: number;
  total_revenue: number | null;
  yoy_growth: number | null;
  ratio: number | null;
  period: string;
  updated_at: string;
}

/** Supabase finance_segments 行类型 */
export interface FinanceSegment {
  id: string;
  company_code: string;
  segment_name: string;
  revenue: number;
  yoy_growth: number | null;
  period: string;
}

/** Supabase finance_quarterly 行类型 */
export interface FinanceQuarterly {
  id: string;
  company_code: string;
  quarter: string;
  game_revenue: number;
}

/** 转换：FinanceCompany → CompanyListRow（列表页渲染用） */
export function toCompanyListRow(c: FinanceCompany): CompanyListRow {
  return {
    code: c.code,
    name: c.name,
    market: c.market,
    gameRevenue: c.game_revenue,
    yoyGrowth: c.yoy_growth ?? 0,
    ratio: c.ratio ?? 0,
    period: c.period,
  };
}
