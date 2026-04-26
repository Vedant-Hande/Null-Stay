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
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
      // Warning: Encourages removing debug logs (console.log) before deploying to production.
      "prefer-const": "error",
      // Best Practice: Ensures variables that are never reassigned are declared as 'const', improving code readability and preventing accidental reassignments.
      "no-unused-vars": [
        "warn",
        { vars: "all", args: "after-used", ignoreRestSiblings: false },
      ],
      // Cleanup: Helps identify variables, function arguments, or imports that are defined but never used, keeping the codebase lean.
      semi: ["error", "always"],
      // Style: Enforces the use of semicolons to avoid issues with Automatic Semicolon Insertion (ASI) and maintain a consistent coding style.
      quotes: ["error", "double"],
      // Consistency: Enforces the use of double quotes for strings across the entire project for a uniform appearance.
      "no-multi-spaces": "error",
      // Cleanliness: Disallows multiple spaces between tokens, ensuring the code is compact and professional.
      "no-trailing-spaces": "error",
      // Cleanliness: Removes invisible spaces at the end of lines which can cause unnecessary diffs in version control (git).
      eqeqeq: "error",
      // Security/Safety: Forces the use of triple-equals (===) to avoid type coercion bugs that happen with double-equals (==).
      "no-undef": "error",
      // Error Prevention: Catches typos by alerting you when you try to use a variable that hasn't been declared yet.
      "no-var": "error",
      // Modern JS: Replaces old 'var' with 'let' and 'const' to ensure block-scoping and more predictable variable behavior.
    },
  },
];
