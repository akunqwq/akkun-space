// lib/personal-events/index.ts
// -----------------------------------------------------------------------------
// 个人事件系统 — 聚合入口。
//
// 三层守卫（项目 U1）：
//   - config.ts / events.ts 顶部含 'server-only'，禁止进入客户端 bundle，
//     因此**不**在聚合入口 re-export；调用方需直接 import 子路径。
//   - 本入口只导出纯类型（types.ts），客户端组件 / API Route / 工具函数可安全引用。
//   - 任何 client 模块 import 本入口时，只拿得到类型；运行环境不会带任何日期。
// -----------------------------------------------------------------------------
export type { PersonalEventPublic, PersonalEventType } from './types';
