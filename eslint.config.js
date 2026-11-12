import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettierCompatibility from "eslint-config-prettier";

const BROWSER_CODE = ["web/frontend/**/*.{js,jsx}", "widget/src/**/*.{js,jsx}"];
const NODE_CODE = [
  "eslint.config.js",
  "web/**/*.js",
  "widget/build.mjs",
  "web/frontend/vite.config.js",
];

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      ".shopify/**",
      "extensions/countdown-timer/assets/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": [
        "error",
        { ignoreRestSiblings: true, argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: NODE_CODE,
    ignores: ["web/frontend/**/*.{js,jsx}", "!web/frontend/vite.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: BROWSER_CODE,
    ignores: ["web/frontend/vite.config.js"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: { version: "18.3" },
    },
    plugins: {
      react,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      "react/prop-types": "off",
    },
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: BROWSER_CODE,
  },
  {
    files: ["web/frontend/**/*.jsx"],
    rules: {
      "react/no-unknown-property": ["error", { ignore: ["variant"] }],
    },
  },
  {
    files: ["widget/src/**/*.{js,jsx}"],
    rules: {
      "react/no-unknown-property": ["error", { ignore: ["class"] }],
    },
  },
  prettierCompatibility,
];
