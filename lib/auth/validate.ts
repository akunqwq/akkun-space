// lib/auth/validate.ts
// -----------------------------------------------------------------------------
// 注册/登录输入校验（纯函数，客户端可复用提前校验，服务端强制复检）。
// 不放 server-only 模块：登录表单在客户端也做同样的第一道校验。
// -----------------------------------------------------------------------------

/** 邮箱格式（实用级宽松校验，细节由收信方把关） */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** 判定字符串是否形如邮箱（用于登录时区分"账号名"与"邮箱"两种标识） */
export function isEmail(value: string): boolean {
  return isValidEmail(value);
}

/** 账号名（登录标识）：3-20 位，字母/数字/下划线，不含 @（以区别于邮箱） */
export function validateUsername(username: string): string | null {
  const u = username.trim();
  if (!u) return '请输入账号名';
  if (u.length < 3 || u.length > 20) return '账号名需 3-20 位';
  if (!/^[A-Za-z0-9_]+$/.test(u)) return '账号名仅限字母、数字、下划线';
  return null;
}

/**
 * 密码规则：8-128 位，且必须同时包含「数字 + 字母 + 符号（非字母数字）」。
 * 注：密码哈希已用 scrypt（lib/auth/hash），属现代加密型；此处只收紧"可用人话记住"
 * 的弱口令，不改动哈希本身。
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return '密码至少 8 位';
  if (password.length > 128) return '密码最长 128 位';
  if (!/[0-9]/.test(password)) return '密码必须包含数字';
  if (!/[A-Za-z]/.test(password)) return '密码必须包含字母';
  if (!/[^A-Za-z0-9]/.test(password)) return '密码必须包含符号（如 !@#$%^&*）';
  return null;
}
