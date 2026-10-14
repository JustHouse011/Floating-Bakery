import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import refresh from "eslint-plugin-react-refresh";
export default tseslint.config(
  { ignores: ["dist", ".tools", ".vercel/**", "server/*.js", "qa/evidence/**", "playwright-report/**", "test-results/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: globals.node } },
  {
    files: ["scripts/qa-*.mjs", "e2e/**/*.mjs", "playwright.config.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": hooks, "react-refresh": refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
);
