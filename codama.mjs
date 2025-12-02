import fs from 'node:fs';
import path from 'node:path';

const prettierOptions = JSON.parse(
  fs.readFileSync(path.join('clients', 'js', '.prettierrc.json'), 'utf-8')
);

export default {
  idl: 'program/idl.json',
  before: [],
  scripts: {
    js: {
      from: '@codama/renderers-js',
      args: [
        'clients/js/src/generated',
        {
          packageFolder: 'clients/js',
          prettierOptions,
          syncPackageJson: true,
        },
      ],
    },
    rust: {
      from: '@codama/renderers-rust',
      args: [
        'clients/rust/src/generated',
        {
          anchorTraits: false,
          crateFolder: 'clients/rust',
          formatCode: true,
          toolchain: '+nightly-2025-02-16',
        },
      ],
    },
  },
};
