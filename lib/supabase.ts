// 服务端 / 客户端通用 Supabase 客户端
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

// Supabase 是可选增强功能（点赞/阅读量/留言板），非核心内容依赖。
// 环境变量缺失时返回 null，SSG 构建不崩溃，调用方降级处理。
// 类型诚实地推导为 SupabaseClient | null，编译器强制调用方做 null 检查。
export const supabase = (url && key)
  ? createClient(url, key)
  : null
