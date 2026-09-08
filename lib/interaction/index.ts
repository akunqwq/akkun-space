// 聚合入口职责：只 re-export 客户端可用的子模块。
// supabase-storage.ts 含 SUPABASE_SERVICE_ROLE_KEY（绕 RLS 的服务端密钥），
//   严禁进客户端 bundle——它顶部带 'server-only' 强约束，
//   调用方须走具体子路径 @/lib/interaction/supabase-storage。
// 客户端组件从本聚合入口拿 supabase（客户端 client，anon key，受 RLS 约束）。
export * from './supabase';
