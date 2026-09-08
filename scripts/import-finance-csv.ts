// scripts/import-finance-csv.ts
// -----------------------------------------------------------------------------
// 读取 data/finance/{companies,segments,quarterly}.csv 并 upsert 进 Supabase。
// 直连 createClient（service_role），避开 lib/tools/finance-queries 的 server-only 限制，
// 因此本脚本可被 tsx 直接运行（server-only 在 Node 下会直接 throw）。
//
// 运行（在项目根目录）：
//   npx tsx scripts/import-finance-csv.ts
// 需要环境变量：NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//
// 不变式：companies.csv 的 code 列必须与 lib/tools/finance-data.ts 的
// FINANCE_COMPANIES 完全一致（路由校验 / generateStaticParams / 本脚本共用）。
// market 归一化：CSV 用 A，本脚本转为 A股（与 FinanceCompanyConfig.market 取值对齐）。
// -----------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// tsx 直接运行时不会自动加载 .env.local（Next 仅对 app 运行时注入），
// 这里在读取环境变量之前显式加载；CI / 生产环境若已通过环境变量注入则跳过。
const envLocal = join(process.cwd(), '.env.local');
if (existsSync(envLocal)) {
  const loadEnvFile = (process as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loadEnvFile === 'function') loadEnvFile(envLocal);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '缺少环境变量：NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const DATA_DIR = join(process.cwd(), 'data', 'finance');

function readCsv(name: string): string[][] {
  const raw = readFileSync(join(DATA_DIR, name), 'utf-8');
  return raw
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(','));
}

/** market 归一化：CSV 用 A/HK/US，DB 存 A股/HK/US */
function normalizeMarket(m: string): string {
  return m.trim() === 'A' ? 'A股' : m.trim();
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(v: string): number | null {
  const t = v.trim();
  if (t === '' || t === 'null' || t === 'NaN') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

async function main(): Promise<void> {
  // 1) companies（upsert，按 code 覆盖）
  const companyRows = readCsv('companies.csv').slice(1);
  const companies = companyRows.map((r) => ({
    code: r[0],
    name: r[1],
    market: normalizeMarket(r[2]),
    game_revenue: num(r[3]),
    total_revenue: numOrNull(r[4]),
    yoy_growth: numOrNull(r[5]),
    ratio: numOrNull(r[6]),
    period: r[7],
    updated_at: new Date().toISOString(),
  }));
  const { error: e1 } = await supabase
    .from('finance_companies')
    .upsert(companies, { onConflict: 'code' });
  if (e1) throw e1;
  console.log(`upserted finance_companies: ${companies.length}`);

  // 本批次涉及的公司 code（用于先清后插，避免重复累积）
  const codes = companies.map((c) => c.code);

  // 2) segments（先删本批次公司旧数据，再插入）
  const segmentRows = readCsv('segments.csv').slice(1);
  const segments = segmentRows.map((r) => ({
    company_code: r[0],
    segment_name: r[1],
    revenue: num(r[2]),
    yoy_growth: numOrNull(r[3]),
    period: r[4],
  }));
  const { error: e2d } = await supabase
    .from('finance_segments')
    .delete()
    .in('company_code', codes);
  if (e2d) throw e2d;
  const { error: e2 } = await supabase
    .from('finance_segments')
    .insert(segments);
  if (e2) throw e2;
  console.log(`inserted finance_segments: ${segments.length}`);

  // 3) quarterly（先删本批次公司旧数据，再插入）
  const quarterlyRows = readCsv('quarterly.csv').slice(1);
  const quarterly = quarterlyRows.map((r) => ({
    company_code: r[0],
    quarter: r[1],
    game_revenue: num(r[2]),
  }));
  const { error: e3d } = await supabase
    .from('finance_quarterly')
    .delete()
    .in('company_code', codes);
  if (e3d) throw e3d;
  const { error: e3 } = await supabase
    .from('finance_quarterly')
    .insert(quarterly);
  if (e3) throw e3;
  console.log(`inserted finance_quarterly: ${quarterly.length}`);

  console.log('导入完成');
}

main().catch((e) => {
  console.error('导入失败:', e);
  process.exit(1);
});
