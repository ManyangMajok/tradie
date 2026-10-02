// Reuse the demo web toolchain installed by npm ci in web/.
import { createRequire } from 'node:module';
const require = createRequire(new URL('./web/package.json', import.meta.url));
const tseslint = require('typescript-eslint');
export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx}'], rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    '@typescript-eslint/no-require-imports': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
  } },
  { ignores: ['**/*.js'] },
);
