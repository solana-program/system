import solanaConfig from '@solana/eslint-config-solana';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    { ignores: ['**/dist/**'] },
    { files: ['**/*.ts', '**/*.(c|m)?js'], extends: [solanaConfig] },
    {
        languageOptions: { parserOptions: { project: null } },
        rules: {
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/sort-type-constituents': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            'prefer-destructuring': 'off',
            'simple-import-sort/imports': 'off',
            'sort-keys-fix/sort-keys-fix': 'off',
            'typescript-sort-keys/interface': 'off',
        },
    },
]);
