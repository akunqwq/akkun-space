// lib/auth/hash.ts
// -----------------------------------------------------------------------------
// 密码哈希（server-only）。
// 用 Node 内置 scrypt（内存难解 KDF，OWASP 认可），零外部依赖——
// 不装 argon2（原生模块编译链）与 bcrypt（额外包），符合"不过度工程"。
// 存储格式自带参数，未来调参/换算法可平滑演进：
//   scrypt$<N>$<r>$<p>$<salt_hex>$<hash_hex>
// -----------------------------------------------------------------------------
import 'server-only';

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

// promisify 泛型推导会选中 3 参 overload，丢掉 options；
// 显式断言为带 options 的 4 参签名，让 TS 约束真实调用形态
const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: ScryptOptions,
) => Promise<Buffer>;

/** scrypt 参数（Node 默认级别，个人站点足够；格式内记录便于未来升级） */
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;

/** 明文密码 → 可存储的哈希串 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const derived = (await scryptAsync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })) as Buffer;
  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join('$');
}

/** 校验明文密码是否匹配存储哈希（timingSafeEqual 防时序比较侧信道） */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  try {
    const derived = (await scryptAsync(password, Buffer.from(saltHex, 'hex'), hashHex.length / 2, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
    })) as Buffer;
    const expected = Buffer.from(hashHex, 'hex');
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
