export interface Holiday {
  name: string;
  date: Date;
}

export const holidays: Holiday[] = [
  { name: '2026 元旦', date: new Date('2026-01-01') },
  { name: '寒假', date: new Date('2026-01-18') },
  { name: '除夕', date: new Date('2026-02-16') },
  { name: '过年', date: new Date('2026-02-17') },
  { name: '元宵', date: new Date('2026-03-03') },
  { name: '清明节', date: new Date('2026-04-05') },
  { name: '劳动节', date: new Date('2026-05-01') },
  { name: '五四青年节', date: new Date('2026-05-04') },
  { name: '端午节', date: new Date('2026-06-19') },
  { name: '中秋节', date: new Date('2026-09-25') },
  { name: '国庆节', date: new Date('2026-10-01') }
];

export function getCountdown() {
  const now = new Date();
  
  // 找到最近的未来节假日
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
  
  return '暂无即将到来的节假日';
}