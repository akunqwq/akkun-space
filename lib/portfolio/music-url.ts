// 客户端签名 URL helper：为私有桶对象换临时签名 URL，带内存缓存 + 过期自动重取。
// 供 CoverImage（封面）与 MusicProvider（音频）共用，避免重复请求 /api/music/url。

type CacheEntry = { url: string; expiresAt: number; inflight: Promise<string> | null };

const cache = new Map<string, CacheEntry>();
// 提前 60s 视为过期，留出续签余量
const EXPIRY_BUFFER = 60_000;

/**
 * 取某对象的签名 URL。命中缓存且未临近过期时直接返回，否则向 /api/music/url 换新。
 * 同一 key 并发请求会被合并为单次 inflight（去重）。
 */
export async function getSignedMusicUrl(key: string): Promise<string> {
  const entry = cache.get(key);
  if (entry && entry.expiresAt - Date.now() > EXPIRY_BUFFER) {
    return entry.url;
  }

  // 已有 inflight（如过期重取进行中）→ 复用，避免抖动期间重复打接口
  if (entry?.inflight) {
    return entry.inflight;
  }

  const inflight = (async () => {
    const res = await fetch(`/api/music/url?key=${encodeURIComponent(key)}`);
    if (!res.ok) {
      cache.delete(key);
      throw new Error(`签名失败 (${res.status})`);
    }
    const { url, expiresAt } = (await res.json()) as {
      url: string;
      expiresAt: number;
    };
    cache.set(key, { url, expiresAt, inflight: null });
    return url;
  })();

  // 先占位（expiresAt=0 表示待填充），inflight 完成后会覆写
  cache.set(key, { url: entry?.url ?? "", expiresAt: 0, inflight });

  return inflight;
}

/** 清除指定 key 的缓存（签名 URL 失效 / 403 时强制重签用）。 */
export function invalidateSignedMusicUrl(key: string) {
  cache.delete(key);
}
