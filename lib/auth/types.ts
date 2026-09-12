// lib/auth/types.ts
// -----------------------------------------------------------------------------
// 认证纯类型（客户端可用，经 index.ts re-export）。
// 逻辑与 fs/crypto 物理隔离，遵守 lib 分包纪律。
// -----------------------------------------------------------------------------

/** 登录用户（服务端 getCurrentUser 返回，绝不含 password_hash）
 *  - username：登录标识（必填，唯一）
 *  - email：可选；仅用于验证码登录等增强能力，未绑定则为 null
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
}

/** API 统一响应外壳（/api/auth/*） */
export interface AuthApiResponse {
  ok: boolean;
  error?: string;
}
