import { execSync } from 'node:child_process';

const nightly = execSync('make --no-print-directory rust-toolchain-nightly').toString().trim();

export default {
    idl: 'idl.json',
    before: [],
    scripts: {
        js: {
            from: '@codama/renderers-js',
            args: [
                'clients/js',
                {
                    kitImportStrategy: 'rootOnly',
                    prettierOptions: {
                        arrowParens: 'avoid',
                        printWidth: 120,
                        singleQuote: true,
                        tabWidth: 4,
                    },
                },
            ],
        },
        rust: {
            from: '@codama/renderers-rust',
            args: [
                'clients/rust',
                {
                    anchorTraits: false,
                    formatCode: true,
                    toolchain: `+${nightly}`,
                },
            ],
        },
    },
};
