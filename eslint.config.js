import globals from "globals";

export default [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node, // process, Buffer, __dirname, require, etc.
        ...globals.browser, // fetch, navigator, localStorage, Notification, CustomEvent, etc.
        io: "readonly", // Socket.io
        Chart: "readonly", // Chart.js
        flatpickr: "readonly", // Flatpickr
        Razorpay: "readonly", // Razorpay
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    rules: {
      "prefer-const": "error",
      "no-unused-vars": [
        "warn",
        { vars: "all", args: "after-used", ignoreRestSiblings: false },
      ],
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-multi-spaces": "error",
      "no-trailing-spaces": "error",
      eqeqeq: "error",
      "no-undef": "error",
      "no-var": "error",
    },
  },
  // ── Service Worker files ───────────────────────────────────────────────
  {
    files: ["**/sw.js", "**/service-worker.js", "**/public/sw.js"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
];
