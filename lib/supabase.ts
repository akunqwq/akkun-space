// 服务端 / 客户端通用 Supabase 客户端
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

// 环境变量缺失时不 throw，避免 SSG 构建崩溃
// 所有引用方均已做 null 检查（if (!supabase) return）
export const supabase = (url && key)
  ? createClient(url, key)
  : null as unknown as ReturnType<typeof createClient>
