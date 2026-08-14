import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // next-env.d.ts 는 Next.js 가 생성하고 덮어쓰는 파일이라 린트 대상에서 뺀다.
  { ignores: [".next/**", "node_modules/**", ".netlify/**", "next-env.d.ts"] },
];

export default eslintConfig;
