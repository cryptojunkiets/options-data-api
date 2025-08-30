/** @type {import("prettier").Config} */
const config = {
  // Use a single quote instead of a double quote.
  singleQuote: true,

  // Add a semicolon at the end of every statement.
  semi: true,

  // Specify the number of spaces per indentation-level.
  tabWidth: 2,

  // Use tabs instead of spaces.
  useTabs: false,

  // Print trailing commas wherever possible in ES5.
  trailingComma: 'es5',

  // Use a consistent line ending.
  endOfLine: 'lf',

  // Print spaces between brackets in object literals.
  bracketSpacing: true,

  // Put the `>` of a multi-line JSX element on the same line as the last prop.
  // Note: This is an older option; `bracketSameLine` is now the preferred name.
  jsxBracketSameLine: false,

  // Omit parentheses when an arrow function has a single parameter.
  arrowParens: 'avoid',

  // Default to a 100-character line length.
  printWidth: 100,

  // If you use Prettier plugins, you would list them here.
  // plugins: [require('prettier-plugin-tailwindcss')],
};

module.exports = config;