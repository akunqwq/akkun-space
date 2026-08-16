import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, SIGNED_URL_TTL } from "@/lib/supabase-storage";
import { MUSIC_BUCKET } from "@/lib/music";

// 为私有桶 `music` 内的对象签发临时签名 URL。
// GET /api/music/url?key=test/audio/song1.mp3
// 返回 { url, expiresAt } —— url 在 expiresAt 前可用，客户端 helper 据此缓存与重签。
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "存储未配置（缺少 SUPABASE_SERVICE_ROLE_KEY）" },
      { status: 503 },
    );
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "缺少 key 参数" }, { status: 400 });
  }
  // 安全：禁止路径穿越（桶内对象路径不应含 ..）
  if (key.includes("..") || key.startsWith("/")) {
    return NextResponse.json({ error: "非法路径" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(MUSIC_BUCKET)
      .createSignedUrl(key, SIGNED_URL_TTL);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || "签名失败" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_URL_TTL * 1000,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "签名异常";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
