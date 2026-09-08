import type { FinanceQuarterly } from '@/lib/tools/finance-data';

/**
 * 季度游戏营收趋势柱状图（服务端渲染，inline SVG，无客户端依赖）。
 * 接收 getQuarterlyTrend 倒序后的数据（旧→新），按 X 轴顺序排列。
 */
export default function RevenueBarChart({
  data,
  unit = '亿',
}: {
  data: FinanceQuarterly[];
  unit?: string;
}) {
  if (!data.length) {
    return <p className="text-sm text-[var(--text-muted)]">暂无季度数据</p>;
  }

  const max = Math.max(...data.map((d) => d.game_revenue), 1);
  const W = 680;
  const H = 260;
  const padL = 44;
  const padR = 16;
  const padT = 24;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = data.length;
  const gap = 18;
  const barW = innerW / n - gap;
  const yFor = (v: number) => padT + innerH * (1 - v / max);

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
      <h3 className="mb-2 text-base font-semibold text-[var(--text-primary)]">
        季度游戏营收趋势
      </h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="季度游戏营收趋势柱状图"
      >
        <line
          x1={padL}
          y1={padT + innerH}
          x2={W - padR}
          y2={padT + innerH}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const x = padL + i * (barW + gap) + gap / 2;
          const y = yFor(d.game_revenue);
          const h = padT + innerH - y;
          return (
            <g key={d.quarter}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={6}
                fill="var(--accent)"
                opacity={0.85}
              />
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={12}
                fill="var(--text-secondary)"
              >
                {d.game_revenue.toFixed(1)}
              </text>
              <text
                x={x + barW / 2}
                y={padT + innerH + 18}
                textAnchor="middle"
                fontSize={12}
                fill="var(--text-muted)"
              >
                {d.quarter}
              </text>
            </g>
          );
        })}
        <text
          x={padL - 6}
          y={padT + 4}
          textAnchor="end"
          fontSize={10}
          fill="var(--text-muted)"
        >
          {max.toFixed(0)}
          {unit}
        </text>
      </svg>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        单位：{unit}（人民币）
      </p>
    </div>
  );
}
