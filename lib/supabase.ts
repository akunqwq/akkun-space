// 服务端 / 客户端通用 Supabase 客户端（anon key，受 RLS 约束）
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  // 仅在服务端（API Route / Server Component）中报错；
  // 客户端环境变量不可用是预期行为，静默跳过以避免构建崩溃。
  if (typeof window === 'undefined') {
    throw new Error('Missing Supabase environment variables')
  }
}

export const supabase = typeof window !== 'undefined' && (!url || !key)
  ? null as unknown as ReturnType<typeof createClient>
  : createClient(url!, key!)
