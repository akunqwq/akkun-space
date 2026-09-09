// lib/personal-events/events.ts
// -----------------------------------------------------------------------------
// 个人事件系统 — 服务端事件判断与元数据生成。
// 强约束：顶部 import 'server-only'。
//
// 扩展指南（无需改客户端 / API Route / 任何 UI）：
//   1) 在 types.ts 扩展 PersonalEventType
//   2) 在 config.ts 加对应环境变量（可选）
//   3) 在下方写一个 check<Name>(today) 函数
//   4) 注册到 EVENT_CHECKERS 数组
// -----------------------------------------------------------------------------
import 'server-only';

import type { PersonalEventPublic, PersonalEventType } from './types';
import { eventEnv } from './config';

/** 生成事件 ID：类型 + 公历日期（用于 localStorage 当日去重，跨日自动失效）。 */
function eventId(type: PersonalEventType, today: Date): string {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${type}-${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// 单个事件判断函数（每个函数自包含，自检配置是否齐全 + 日期是否匹配）
// 触发成功返回 PersonalEventPublic；否则返回 null。
// ---------------------------------------------------------------------------

/** 生日：今日 MM-DD == PERSONAL_BIRTHDAY */
function checkBirthday(today: Date): PersonalEventPublic | null {
  const v = eventEnv.birthday;
  if (!v) return null;
  const [mmStr, ddStr] = v.split('-');
  const mm = Number(mmStr);
  const dd = Number(ddStr);
  if (!Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  if (today.getMonth() + 1 !== mm || today.getDate() !== dd) return null;
  return {
    id: eventId('birthday', today),
    type: 'birthday',
    emoji: '🎂',
    title: 'Happy Birthday!',
    message: '今天是阿鲲的生日，又长大了一岁，继续折腾吧。',
    ctaLabel: '收下祝福',
  };
}

/** 网站周年：今日 MM-DD == SITE_LAUNCHED_AT 的 MM-DD，且周年数 >= 1 */
function checkSiteAnniversary(today: Date): PersonalEventPublic | null {
  const v = eventEnv.siteLaunchedAt;
  if (!v) return null;
  const [yyyyStr, mmStr, ddStr] = v.split('-');
  const yyyy = Number(yyyyStr);
  const mm = Number(mmStr);
  const dd = Number(ddStr);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  if (today.getMonth() + 1 !== mm || today.getDate() !== dd) return null;
  const years = today.getFullYear() - yyyy;
  if (years < 1) return null;
  return {
    id: eventId('site-anniversary', today),
    type: 'site-anniversary',
    emoji: '🎉',
    title: `${years} 周年快乐！`,
    message: `今天是阿鲲の小窝 ${years} 周年的日子，感谢一路陪伴。`,
    ctaLabel: '收下祝福',
  };
}

/** 所有已注册的事件判断器。空数组 = 不触发任何事件。 */
const EVENT_CHECKERS: Array<(today: Date) => PersonalEventPublic | null> = [
   checkBirthday,           
   checkSiteAnniversary,     
];

/** 返回今天所有触发的事件。空数组 = 今天无事件，客户端不弹窗。 */
export function getActiveEvents(today: Date = new Date()): PersonalEventPublic[] {
  return EVENT_CHECKERS
    .map((fn) => fn(today))
    .filter((e): e is PersonalEventPublic => e !== null);
}
