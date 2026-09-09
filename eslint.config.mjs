import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/test-results/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["frontend/src/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.worker } },
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  {
    files: ["backend/src/**/*.ts", "scripts/**/*.ts"],
    languageOptions: { globals: { ...globals.node, Bun: "readonly" } },
    rules: { "no-console": "off" },
  },
);
