import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: ['node_modules/**', '.next/**', 'next-env.d.ts', 'public/**', '.playwright-mcp/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default config;
