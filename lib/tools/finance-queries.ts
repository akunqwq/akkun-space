// lib/tools/finance-queries.ts
// -----------------------------------------------------------------------------
// 财报数据 Supabase 查询层。
// 强约束：本模块顶部 import 'server-only'，用 supabaseAdmin（绕 RLS）。
// 复用 lib/interaction/supabase-storage.ts 的 supabaseAdmin，不直接 createClient。
// 避免类型欺骗：supabaseAdmin 推导为 SupabaseClient | null，调用方须 null guard。
// -----------------------------------------------------------------------------
import 'server-only';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';
import type {
  FinanceCompany,
  FinanceQuarterly,
  FinanceSegment,
} from './finance-data';

/**
 * 财报查询器：封装 finance_companies / finance_segments / finance_quarterly 三表查询。
 */
export class FinanceQueries {
  /** 获取所有公司（按游戏营收降序） */
  async getAllCompanies(): Promise<FinanceCompany[]> {
    if (!supabaseAdmin) {
      throw new Error('FinanceQueries: supabaseAdmin 未配置（缺少 SUPABASE_SERVICE_ROLE_KEY）');
    }
    const { data, error } = await supabaseAdmin
      .from('finance_companies')
      .select('*')
      .order('game_revenue', { ascending: false });
    if (error) {
      throw new Error(`FinanceQueries.getAllCompanies: ${error.message}`);
    }
    return (data ?? []) as FinanceCompany[];
  }

  /** 按 code 查单个公司，不存在返回 null */
  async getCompanyByCode(code: string): Promise<FinanceCompany | null> {
    if (!supabaseAdmin) {
      throw new Error('FinanceQueries: supabaseAdmin 未配置');
    }
    const { data, error } = await supabaseAdmin
      .from('finance_companies')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (error) {
      throw new Error(`FinanceQueries.getCompanyByCode: ${error.message}`);
    }
    return (data as FinanceCompany | null) ?? null;
  }

  /** 营收构成（国内/海外或分品类） */
  async getSegments(code: string): Promise<FinanceSegment[]> {
    if (!supabaseAdmin) {
      throw new Error('FinanceQueries: supabaseAdmin 未配置');
    }
    const { data, error } = await supabaseAdmin
      .from('finance_segments')
      .select('*')
      .eq('company_code', code)
      .order('revenue', { ascending: false });
    if (error) {
      throw new Error(`FinanceQueries.getSegments: ${error.message}`);
    }
    return (data ?? []) as FinanceSegment[];
  }

  /** 近 N 季度游戏营收趋势（按 quarter 降序，limit 条） */
  async getQuarterlyTrend(code: string, limit: number): Promise<FinanceQuarterly[]> {
    if (!supabaseAdmin) {
      throw new Error('FinanceQueries: supabaseAdmin 未配置');
    }
    const { data, error } = await supabaseAdmin
      .from('finance_quarterly')
      .select('*')
      .eq('company_code', code)
      .order('quarter', { ascending: false })
      .limit(limit);
    if (error) {
      throw new Error(`FinanceQueries.getQuarterlyTrend: ${error.message}`);
    }
    // 按 quarter 降序拿最新 N 条，渲染时倒序（旧→新）展示
    return ((data ?? []) as FinanceQuarterly[]).reverse();
  }
}

/** 单例 */
let financeQueries: FinanceQueries | null = null;

export function getFinanceQueries(): FinanceQueries {
  if (!financeQueries) {
    financeQueries = new FinanceQueries();
  }
  return financeQueries;
}
