import path from 'node:path';
import fs from 'node:fs';

const prettierOptions = JSON.parse(
  fs.readFileSync(path.join('clients', 'js', '.prettierrc.json'), 'utf-8')
);

export default {
  idl: 'program/idl.json',
  before: [],
  scripts: {
    js: {
      from: '@codama/renderers-js',
      args: ['clients/js/src/generated', { prettierOptions }],
    },
    rust: {
      from: '@codama/renderers-rust',
      args: [
        'clients/rust/src/generated',
        {
          anchorTraits: false,
          crateFolder: 'clients/rust',
          formatCode: true,
          toolchain: '+1.86.0',
        },
      ],
    },
  },
};
