// 客户端 Supabase 客户端（anon key，受 RLS 约束）
// 供 'use client' 组件使用（LikeButton / ViewCounter）。
// 只能用 NEXT_PUBLIC_* 变量——service_role key 严禁进入客户端 bundle。
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 类型诚实地推导为 SupabaseClient | null，编译器强制调用方做 null 检查。
// 服务端 API（guestbook / music 签名）请用 lib/supabase-storage.ts 的 supabaseAdmin。
export const supabase = (url && anonKey)
  ? createClient(url, anonKey)
  : null
