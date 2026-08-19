import { NextResponse } from "next/server";

// 临时诊断探针：仅返回环境变量「是否存在」的布尔值，绝不输出任何密钥内容。
// 定位完 Vercel 环境变量缺失问题后即删除。
export const dynamic = "force-dynamic";

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({ hasUrl, hasServiceKey });
}
