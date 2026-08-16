// 问候池：Header 中部自动轮播
// 数据源：data/site/greetings.json
// 约束：短句为主（≤8 字宽），避免三栏 header 中部溢出被裁切
import greetingsData from "@/data/site/greetings.json";

export const GREETINGS: string[] = greetingsData.greetings;

// 每句打字完成后停留的时长（ms），随后自动切到下一句
export const GREETING_DWELL: number = greetingsData.dwellMs;
