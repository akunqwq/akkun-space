import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 输入限制常量
const MAX_NAME_LENGTH = 50
const MAX_TEXT_LENGTH = 1000

// GET /api/guestbook —— 读取最新留言
// GET /api/guestbook?since=ISO_TIMESTAMP —— 获取该时间之后的新增留言数
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since');

  // 未读数查询模式
  if (since) {
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json({ error: '无效的时间戳格式' }, { status: 400 });
    }

    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', sinceDate.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ unread: count ?? 0 });
  }

  // 常规列表查询（原有逻辑）
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments: data ?? [] })
}

// POST /api/guestbook —— 提交新留言
export async function POST(req: NextRequest) {
  // 解析请求体
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体格式错误，请发送有效的 JSON' }, { status: 400 })
  }

  // 类型检查 + 提取 + 去除首尾空白
  const rawName = body?.user_name
  const rawText = body?.text

  // 确保是字符串类型
  const user_name = typeof rawName === 'string' ? rawName.trim() : ''
  const text = typeof rawText === 'string' ? rawText.trim() : ''

  // 非空校验
  if (!user_name || !text) {
    return NextResponse.json(
      { error: '用户名和内容不能为空' },
      { status: 400 }
    )
  }

  // 长度限制
  if (user_name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `用户名过长，最多 ${MAX_NAME_LENGTH} 个字符` },
      { status: 400 }
    )
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `留言内容过长，最多 ${MAX_TEXT_LENGTH} 个字符` },
      { status: 400 }
    )
  }

  // 写入数据库
  // 注意：无需 XSS 过滤——React 的 {} 渲染会自动 escape 文本内容。
  // 只有使用 dangerouslySetInnerHTML 时才需要额外清理。
  const { data, error } = await supabase
    .from('comments')
    .insert([{ user_name, avatar: '', text, date: new Date().toISOString() }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: data })
}
