import type { CompanyListRow } from '@/lib/tools';

export default function CompanyTable({ rows }: { rows: CompanyListRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-[var(--text-muted)]">暂无公司数据</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--card-border)] text-[var(--text-secondary)]">
          <tr>
            <th className="p-3 font-medium">代码</th>
            <th className="p-3 font-medium">公司</th>
            <th className="p-3 font-medium">市场</th>
            <th className="p-3 text-right font-medium">游戏营收(亿)</th>
            <th className="p-3 text-right font-medium">同比</th>
            <th className="p-3 text-right font-medium">游戏占比</th>
            <th className="p-3 font-medium">财报期</th>
            <th className="p-3 text-center font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-border)]">
          {rows.map((r) => (
            <tr key={r.code} className="transition hover:bg-[var(--accent)]/5">
              <td className="p-3 font-mono text-[var(--text-secondary)]">{r.code}</td>
              <td className="p-3 font-medium text-[var(--text-primary)]">{r.name}</td>
              <td className="p-3 text-[var(--text-secondary)]">{r.market}</td>
              <td className="p-3 text-right font-mono text-[var(--text-primary)]">{r.gameRevenue.toFixed(2)}</td>
              <td className={`p-3 text-right font-mono ${r.yoyGrowth >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {r.yoyGrowth >= 0 ? '+' : ''}
                {r.yoyGrowth.toFixed(1)}%
              </td>
              <td className="p-3 text-right font-mono text-[var(--text-secondary)]">{r.ratio.toFixed(1)}%</td>
              <td className="p-3 text-[var(--text-secondary)]">{r.period}</td>
              <td className="p-3 text-center">
                <a href={`/tools/finance/${encodeURIComponent(r.code)}`} className="text-sm text-[var(--accent)] hover:underline">
                  详情
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
