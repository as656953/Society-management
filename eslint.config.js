import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "api-dist/**",
      "node_modules/**",
      "migrations/**",
      "attached_assets/**",
      "client/src/components/ui/**", // vendored shadcn/ui primitives
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Client
  {
    files: ["client/src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // Server / shared / serverless entry
  {
    files: ["server/**/*.ts", "shared/**/*.ts", "api/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },

  // Project-wide rule tuning
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Codebase predates strict typing discipline; surfaced as warnings so the
      // baseline is visible without blocking. Tighten to "error" incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Config files run in Node and may use console freely
  {
    files: ["*.config.{js,ts}", "drizzle.config.ts"],
    languageOptions: { globals: globals.node },
    rules: { "no-console": "off" },
  }
);
