// app/api/personal-events/today/route.ts
// -----------------------------------------------------------------------------
// 个人事件 API Route：返回今天触发的所有事件（公开元数据，**不含日期**）。
//
// 隐私保证（项目红线）：
//   response 永远不包含"事件触发的具体日期"——访客只能看到
//   "今天有事件 / 没有事件"，看不到你的生日/纪念日是几月几号。
//   日期仅保留在服务端 process.env（lib/personal-events/config.ts），
//   经 lib/personal-events/events.ts 判断后只输出"是否触发"。
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { getActiveEvents } from '@/lib/personal-events/events';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const events = getActiveEvents();
  return NextResponse.json({ events });
}
