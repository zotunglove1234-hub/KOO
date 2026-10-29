const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'android/*', 'ios/*', 'scripts/*'],
  },
  {
    rules: {
      'react/jsx-no-bind': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);
