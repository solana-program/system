import path from 'node:path';

const { default: prettierOptions } = await import(
  path.resolve('clients', 'js', '.prettierrc.json'),
  { with: { type: 'json' } }
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
        },
      ],
    },
  },
};
