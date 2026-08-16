// 节日倒计时数据源：data/site/holidays.json（date 为 ISO 字符串，此处转 Date）
import holidaysData from "@/data/site/holidays.json";

export interface Holiday {
  name: string;
  date: Date;
}

export const holidays: Holiday[] = holidaysData.map((h) => ({
  name: h.name,
  date: new Date(h.date),
}));

export function getCountdown() {
  const now = new Date();
  let nextHoliday = null;
  let minDays = Infinity;

  for (const holiday of holidays) {
    const daysUntil = Math.ceil((holiday.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0 && daysUntil < minDays) {
      minDays = daysUntil;
      nextHoliday = holiday;
    }
  }

  if (nextHoliday) {
    return `距离 ${nextHoliday.name} 还有 ${minDays} 天`;
  }

  return '对不起，今年已经没有节假日了';
}
