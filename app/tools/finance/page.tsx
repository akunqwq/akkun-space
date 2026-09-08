import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';

import { getFinanceQueries } from '@/lib/tools/finance-queries';
import { toCompanyListRow } from '@/lib/tools/finance-data';
import type { CompanyListRow } from '@/lib/tools/types';
import CompanyTable from '@/app/components/tools/CompanyTable';

export const metadata: Metadata = {
  title: '游戏公司财报营收速查',
  description:
    '按游戏营收降序查上市公司游戏业务营收与同比，结构化可对比。',
};

// 财报为低频更新数据：每日重新生成一次（ISR）。
export const revalidate = 86400;

export default async function FinancePage() {
  let rows: CompanyListRow[] = [];
  let unavailable = false;
  try {
    const companies = await getFinanceQueries().getAllCompanies();
    rows = companies.map(toCompanyListRow);
  } catch {
    // Supabase 未配置 / 数据未导入：降级为空表 + 提示，避免构建/访问崩溃。
    unavailable = true;
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
          游戏公司财报营收速查
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          12 家上市游戏公司的游戏业务营收、同比与占比，按游戏营收降序排列。数据来源为各公司定期报告，仅供参考。
        </p>
      </div>
      {unavailable ? (
        <p className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          财报数据服务暂时不可用，请稍后重试。
        </p>
      ) : (
        <CompanyTable rows={rows} />
      )}
    </section>
  );
}
