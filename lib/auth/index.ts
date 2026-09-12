// lib/auth/index.ts
// 聚合入口：只 re-export 纯类型。
// hash.ts / session.ts 顶部带 'server-only'，严禁 re-export 到客户端 bundle；
// 调用方走 @/lib/auth/hash / @/lib/auth/session 拿服务端能力。
export type { AuthApiResponse, AuthUser } from './types';
