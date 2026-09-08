// lib/tools/index.ts
// 聚合入口：只 re-export 客户端可用的纯类型 + 纯函数/常量。
// finance-queries.ts / snapshot-queries.ts 顶部带 'server-only'，严禁 re-export。
// 调用方走子路径 @/lib/tools/finance-queries / @/lib/tools/snapshot-queries。
// 遵循 verbatimModuleSyntax：纯类型 re-export 用 export type。
export type {
  CompanyDetailPageData,
  CompanyListRow,
  ToolCard,
  UpDetailPageData,
  VideoStatResult,
} from './types';

export {
  FINANCE_COMPANIES,
  FEATURED_COMPANIES,
  getCompanyConfig,
  isValidCompanyCode,
  toCompanyListRow,
} from './finance-data';

export type {
  FinanceCompany,
  FinanceCompanyConfig,
  FinanceMarket,
  FinanceQuarterly,
  FinanceSegment,
} from './finance-data';
