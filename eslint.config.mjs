import unusedImports from "eslint-plugin-unused-imports";
import tseslintParser from "@typescript-eslint/parser";

export default [
  { ignores: ["node_modules/**", ".next/**", "out/**", "scripts/**", "public/**", "content/**", "data/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    linterOptions: { reportUnusedDisableDirectives: false },
    plugins: { "unused-imports": unusedImports },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "no-unused-vars": "off",
    },
  },
];
