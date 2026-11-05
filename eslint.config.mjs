import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores: [".next/**", "public/generated/**", "node_modules/**", "scripts/**", "src/client/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
