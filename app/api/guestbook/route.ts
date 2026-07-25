import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 留言板走服务端代理：浏览器不再直连 Supabase，避免跨域 / 网络抖动导致的
// "TypeError: Failed to fetch"。服务端 → Supabase 连接稳定，且本路由自带轻量重试。
export const dynamic = 'force-dynamic'

// 覆盖 Supabase 冷启动 / 瞬时抖动的轻量重试
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)))
      }
    }
  }
  throw lastErr
}

// GET /api/guestbook —— 读取最新留言
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: '数据库连接未配置' }, { status: 503 })
    }

    const data = await withRetry(async () => {
      const { data, error } = await supabase!
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw new Error(error.message || '查询失败')
      return data ?? []
    })

    return NextResponse.json({ comments: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误'
    const status = msg.includes('未配置') ? 503 : 502
    return NextResponse.json({ error: msg }, { status })
  }
}

// POST /api/guestbook —— 提交新留言
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: '数据库连接未配置' }, { status: 503 })
  }

  let body: { user_name?: unknown; text?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 })
  }

  const user_name = (body?.user_name ?? '').toString().trim()
  const text = (body?.text ?? '').toString().trim()

  if (!user_name || !text) {
    return NextResponse.json({ error: '昵称和留言内容不能为空' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ user_name, avatar: '', text, date: new Date().toISOString() }])
      .select()
      .single()

    if (error) {
      const msg = error.message || '提交失败'
      const status = /permission|policy|rls/i.test(msg) ? 403 : 500
      return NextResponse.json({ error: msg }, { status })
    }

    return NextResponse.json({ comment: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '提交失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
