// lib/personal-events/types.ts
// -----------------------------------------------------------------------------
// 个人事件系统 — 共享类型定义（可被客户端组件安全引用，**不含任何日期**）。
//
// 隐私契约（项目红线）：
//   PersonalEventPublic 是「前端可见」的最小集——只含 UI 展示所需字段。
//   任何与"事件何时触发"相关的数据（生日日期、纪念日、commit hash 等）
//   必须保留在 server-only 模块（config.ts / events.ts），
//   永远不进入客户端 bundle 或 API 响应。
// -----------------------------------------------------------------------------

/** 个人事件类型。新增类型需同步扩展 lib/personal-events/events.ts 的判断器。 */
export type PersonalEventType =
  | 'birthday'
  | 'site-anniversary'
  | 'first-post-anniversary'
  | 'first-commit-anniversary';

/** 客户端可见的事件元数据。 */
export interface PersonalEventPublic {
  /** 事件唯一 ID，用于 localStorage 当日去重（建议 type-YYYY-MM-DD）。 */
  id: string;
  type: PersonalEventType;
  emoji: string;
  title: string;
  message: string;
  /** 关闭按钮文案（QQNT 风：单一"收下祝福"按钮）。 */
  ctaLabel: string;
}
