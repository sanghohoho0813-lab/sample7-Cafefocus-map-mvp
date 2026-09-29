import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "scripts/**"],
  },
  {
    rules: {
      // App Router의 루트 layout <head>는 모든 페이지에 적용되므로 해당 경고는 pages/_document 전용이다.
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default eslintConfig;
