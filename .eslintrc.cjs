/* eslint-env node */

module.exports = {
  // Specifies the ESLint parser for TypeScript
  parser: '@typescript-eslint/parser',

  // Specifies the ESLint configuration to extend
  // `eslint:recommended`: a recommended set of rules for general JS.
  // `plugin:@typescript-eslint/recommended`: a recommended set of rules for TypeScript.
  // `prettier`: disables all ESLint rules that are unnecessary or might conflict with Prettier.
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Must be the last one in the extends array.
  ],

  // An object specifying additional configurations for plugins
  plugins: [
    '@typescript-eslint',
    'prettier',
  ],

  // Specifies parser options
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },

  // Environment settings for a script running in a Node.js-like environment
  // A GitHub Runner is essentially a Node.js environment.
  env: {
    node: true,
    es2021: true,
  },

  // Custom rules, if any.
  rules: {
    // You can add or override rules here.
    // For example, to allow console.log in a script:
    // 'no-console': 'off',
    
    // For example, to require explicit types for function return values:
    // '@typescript-eslint/explicit-function-return-type': 'error',
  },
};