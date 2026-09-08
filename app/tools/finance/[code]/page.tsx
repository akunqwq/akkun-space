import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { getFinanceQueries } from '@/lib/tools/finance-queries';
import {
  FEATURED_COMPANIES,
  isValidCompanyCode,
} from '@/lib/tools/finance-data';
import type {
  FinanceQuarterly,
  FinanceSegment,
} from '@/lib/tools/finance-data';
import RevenueBarChart from '@/app/components/tools/RevenueBarChart';

export const revalidate = 86400;

interface Props {
  params: Promise<{ code: string }>;
}

// 阿鲲 U7：只预热头部热门公司；其余 code 首次访问时 ISR 按需生成，新增公司无需重建。
export function generateStaticParams() {
  return FEATURED_COMPANIES.map((c) => ({ code: c.code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `财报速查 · ${decodeURIComponent(code)}`,
    description: '游戏公司游戏业务营收、同比与季度趋势速查。',
  };
}

export default async function FinanceDetailPage({ params }: Props) {
  const { code } = await params;
  if (!isValidCompanyCode(code)) notFound();

  let company: Awaited<
    ReturnType<ReturnType<typeof getFinanceQueries>['getCompanyByCode']>
  > = null;
  let segments: FinanceSegment[] = [];
  let quarterly: FinanceQuarterly[] = [];
  let unavailable = false;

  try {
    const q = getFinanceQueries();
    company = await q.getCompanyByCode(code);
    if (!company) notFound();
    [segments, quarterly] = await Promise.all([
      q.getSegments(code),
      q.getQuarterlyTrend(code, 8),
    ]);
  } catch {
    unavailable = true;
  }

  if (!company) notFound();

  const jsonLd = company
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: company.name,
        identifier: company.code,
        additionalProperty: {
          '@type': 'PropertyValue',
          name: '游戏业务营收',
          value: company.game_revenue,
          unitText: '亿元',
        },
      }
    : null;

  const pct = (v: number | null) =>
    v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

  return (
    <section>
      <Link
        href="/tools/finance"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
      >
        ← 返回列表
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
            {company.name}
          </h2>
          <span className="rounded-full border border-[var(--card-border)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)]">
            {company.code}
          </span>
          <span className="rounded-full border border-[var(--card-border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
            {company.market}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          财报期 {company.period}
        </p>
      </header>

      {unavailable ? (
        <p className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          财报数据服务暂时不可用，请稍后重试。
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="游戏营收" value={`${company.game_revenue.toFixed(2)} 亿`} />
            <Metric
              label="总营收"
              value={
                company.total_revenue != null
                  ? `${company.total_revenue.toFixed(2)} 亿`
                  : '—'
              }
            />
            <Metric
              label="游戏营收同比"
              value={pct(company.yoy_growth)}
              tone={
                company.yoy_growth == null
                  ? 'neutral'
                  : company.yoy_growth >= 0
                    ? 'up'
                    : 'down'
              }
            />
            <Metric
              label="游戏营收占比"
              value={company.ratio != null ? `${company.ratio.toFixed(1)}%` : '—'}
            />
          </div>

          {segments.length > 0 && (
            <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--card-border)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="p-3 font-medium">业务板块</th>
                    <th className="p-3 text-right font-medium">营收(亿)</th>
                    <th className="p-3 text-right font-medium">同比</th>
                    <th className="p-3 font-medium">财报期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {segments.map((s) => (
                    <tr key={s.segment_name}>
                      <td className="p-3 font-medium text-[var(--text-primary)]">
                        {s.segment_name}
                      </td>
                      <td className="p-3 text-right font-mono text-[var(--text-primary)]">
                        {s.revenue.toFixed(2)}
                      </td>
                      <td
                        className={`p-3 text-right font-mono ${
                          s.yoy_growth == null
                            ? 'text-[var(--text-muted)]'
                            : s.yoy_growth >= 0
                              ? 'text-red-400'
                              : 'text-green-400'
                        }`}
                      >
                        {pct(s.yoy_growth)}
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        {s.period}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8">
            <RevenueBarChart data={quarterly} />
          </div>
        </>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}

function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'up' | 'down';
}) {
  const toneClass =
    tone === 'up'
      ? 'text-red-400'
      : tone === 'down'
        ? 'text-green-400'
        : 'text-[var(--text-primary)]';
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}
