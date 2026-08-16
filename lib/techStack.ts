import techStackData from "@/data/content/tech-stack.json";
export const techStack: string[] = techStackData;
// 纯数据源，无 Node 依赖（fs 等），server / client 组件均可安全 import。