// lib/personal-events/config.ts
// -----------------------------------------------------------------------------
// 个人事件系统 — 服务端配置层（持有私人环境变量：生日、纪念日等）。
// 强约束：顶部 import 'server-only'，禁止进入客户端 bundle。
//
// 隐私契约：
//   本模块读取的所有 process.env.* 都不应被 re-export 给客户端代码。
//   调用方仅通过下方 eventEnv getter 访问"值存在与否"，不传值到客户端。
// -----------------------------------------------------------------------------
import 'server-only';

/** 读取可选环境变量，未设置或空字符串时返回 null。 */
function optionalEnv(key: string): string | null {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : null;
}

/** 个人事件相关的环境变量名（与 .env.example 对应，便于文档化与一致性检查）。 */
export const EventEnvKeys = {
  /** 你的公历生日，MM-DD 格式（例如 10-15）。 */
  PERSONAL_BIRTHDAY: 'PERSONAL_BIRTHDAY',
  /** 网站首次上线日，YYYY-MM-DD 格式（例如 2025-01-01）。 */
  SITE_LAUNCHED_AT: 'SITE_LAUNCHED_AT',
} as const;

/** 个人事件相关的环境变量访问器（getter 风格，外部仅能"问有没有"，拿不到值）。 */
export const eventEnv = {
  get birthday(): string | null {
    return optionalEnv(EventEnvKeys.PERSONAL_BIRTHDAY);
  },
  get siteLaunchedAt(): string | null {
    return optionalEnv(EventEnvKeys.SITE_LAUNCHED_AT);
  },
};
