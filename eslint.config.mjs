import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  // 项目级覆盖：忽略非源码目录（next/typescript 与 next/core-web-vitals 默认包含 node_modules 与 .next）
  { ignores: ["scripts/**", "public/**", "content/**", "data/**"] },
  // 启用 unused-imports（之前仅有的规则保留）
  {
    files: ["**/*.{ts,tsx}"],
    linterOptions: { reportUnusedDisableDirectives: false },
    plugins: { "unused-imports": unusedImports },
    rules: {
      "unused-imports/no-unused-imports": "error",
      // React 19 新规则降级为 warn（next/typescript 默认 error）
      // 理由：项目存在 19 处 effect 内 setState 用于 mount 检测 / SSR 安全 / 派生状态同步，
      // 都是合法用法。批量 disable 注释污染代码、价值低；待未来逐个评估是否可改为
      // useState lazy init / useMemo 派生后再升回 error。
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;