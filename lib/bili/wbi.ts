// lib/bili/wbi.ts
// -----------------------------------------------------------------------------
// WBI 签名实现 — 命门模块。
// 强约束：本模块顶部 import 'server-only'，不进客户端 bundle。
// 签名密钥（img_key/sub_key）每日轮换，从 /x/web-interface/nav 动态获取，
// 再通过固定置换表 MIXIN_KEY_ENC_TAB 重排，截取前 32 字符生成 mixin_key，
// 最后将参数加 wts 后按字典序排序，拼接后附 mixin_key 做 MD5 得到 w_rid。
// 纯 Node.js 内置 crypto 模块，零第三方依赖。
// -----------------------------------------------------------------------------
import 'server-only';

import crypto from 'crypto';

import type { WbiSignResult } from './types';

// 社区逆向已公开的 MIXIN_KEY_ENC_TAB 置换表（64 个索引，B 站前端硬编码）。
// 来源：SocialSisterYi/bilibili-API-collect（docs/misc/sign/wbi.md），多源交叉验证一致：
//   DeepWiki 镜像、掘金 7278129589518991397、腾讯云开发者文章 2723516 均为同一张表。
// 该表自 2023 年 3 月 WBI 上线以来未变更，但 B 站有权随时改动，需持续关注。
// ⚠️ 历史教训：曾误用一张被污染/错位的表，导致 mixin_key 错误 → 所有 WBI 接口
//    签名无效（非 -352 风控），acc/info 与 arc/search 直接被拒。换回本表即修复。
const MIXIN_KEY_ENC_TAB: readonly number[] = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
  27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
  37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
  22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

const BASE_URL = 'https://api.bilibili.com';
const NAV_PATH = '/x/web-interface/nav';
const KEY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h：密钥每日轮换，24h 足够安全

/** 从 img_url/sub_url 提取文件名作为 key（去掉扩展名） */
function extractKeyFromUrl(url: string): string {
  // URL 形如 https://i0.hdslb.com/bfs/wbi/7cd4230asd1x2c3v4b.png
  const filename = url.slice(url.lastIndexOf('/') + 1);
  const dotIdx = filename.lastIndexOf('.');
  return dotIdx >= 0 ? filename.slice(0, dotIdx) : filename;
}

/**
 * WBI 签名器：负责获取轮换密钥 + 生成签名。
 * 实例在 BiliClient 中复用，密钥 24h 内只拉取一次。
 */
export class WbiSigner {
  private imgKey: string | null = null;
  private subKey: string | null = null;
  private mixinKey: string | null = null;
  private keyFetchedAt = 0;

  /** 确保密钥已获取（首次调用或缓存过期时从 nav 接口拉取） */
  async ensureKeys(): Promise<void> {
    if (this.mixinKey && Date.now() - this.keyFetchedAt < KEY_CACHE_TTL) {
      return;
    }
    await this.fetchNavKeys();
  }

  /** 从 B 站 nav 接口拉取 img_key / sub_key 并计算 mixin_key */
  private async fetchNavKeys(): Promise<void> {
    const url = `${BASE_URL}${NAV_PATH}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/',
      },
      // 避免缓存 nav 响应，确保拿到最新轮换密钥
      cache: 'no-store',
    });
    if (!resp.ok) {
      throw new Error(`WbiSigner: nav 请求失败 status=${resp.status}`);
    }
    const json = (await resp.json()) as {
      code: number;
      data?: { wbi_img?: { img_url?: string; sub_url?: string } };
    };
    const wbiImg = json?.data?.wbi_img;
    if (!wbiImg?.img_url || !wbiImg?.sub_url) {
      throw new Error('WbiSigner: nav 响应缺少 wbi_img 字段');
    }
    this.imgKey = extractKeyFromUrl(wbiImg.img_url);
    this.subKey = extractKeyFromUrl(wbiImg.sub_url);
    this.mixinKey = this.getMixinKey(this.imgKey + this.subKey);
    this.keyFetchedAt = Date.now();
  }

  /** 对拼接后的 orig 按 MIXIN_KEY_ENC_TAB 重排，遍历全部 64 项后取前 32 字符
   *  （标准算法：reduce(orig[i], tab)[:32]，与社区参考实现一致） */
  private getMixinKey(orig: string): string {
    let result = '';
    for (const idx of MIXIN_KEY_ENC_TAB) {
      if (idx < orig.length) {
        result += orig.charAt(idx);
      }
    }
    return result.slice(0, 32);
  }

  /**
   * 对参数签名，返回 w_rid 和 wts。
   * params 不含 wts；本方法内部注入 wts（当前秒级时间戳）并排序。
   * 特殊字符需做 encodeURIComponent（除 !*()' 外，与社区实现一致）。
   */
  async sign(params: Record<string, string>): Promise<WbiSignResult> {
    await this.ensureKeys();
    if (!this.mixinKey) {
      throw new Error('WbiSigner: mixinKey 未就绪');
    }
    const wts = Math.floor(Date.now() / 1000);
    const merged: Record<string, string> = { ...params, wts: String(wts) };

    // 字典序排序
    const sortedKeys = Object.keys(merged).sort();
    // 过滤特殊字符（与社区实现一致：保留 ()!*' 和字母数字-_=:其他字符做 encodeURIComponent）
    const parts = sortedKeys.map((k) => {
      const val = String(merged[k]);
      // 简化：用标准 encodeURIComponent，再补回 !*()'，社区通行做法
      const encoded = encodeURIComponent(val)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
      return `${k}=${encoded}`;
    });
    const query = parts.join('&');
    const toSign = `${query}${this.mixinKey}`;
    const w_rid = crypto.createHash('md5').update(toSign).digest('hex');

    return { w_rid, wts };
  }
}
