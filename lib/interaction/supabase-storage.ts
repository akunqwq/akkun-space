// 强约束：本模块含 SUPABASE_SERVICE_ROLE_KEY（绕 RLS 的服务端密钥），
// 严禁进客户端 bundle。任何客户端组件误 import 本模块（含绕过聚合入口直接走
// @/lib/interaction/supabase-storage）会在构建期立即报错给出清晰提示，
// 而非靠 webpack tree-shaking 隐式保护——一旦 tree-shaking 失效立即泄露 key。
// 客户端组件请用 @/lib/interaction 聚合入口拿 supabase（客户端 client，anon key）。
import 'server-only';

// 服务端专用 Supabase 客户端（service_role key，绕过 RLS）
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;


export const SIGNED_URL_TTL = 3600; // 1 小时
