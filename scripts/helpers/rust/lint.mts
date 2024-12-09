// Script to lint a crate.
//
// This script runs the following sub-scripts:
// - lint-clippy.mjs
// - lint-docs.mjs
// - lint-features.mjs

import { workingDirectory } from '../utils.mts';

const scripts = path.join(workingDirectory, 'scripts', 'helpers', 'rust');

// clippy
await $`tsx ${path.join(scripts, 'lint-clippy.mjs')} ${process.argv.slice(2)}`;
// rustdoc
await $`tsx ${path.join(scripts, 'lint-docs.mjs')} ${process.argv.slice(2)}`;
// features
await $`tsx ${path.join(scripts, 'lint-features.mjs')} ${process.argv.slice(2)}`;
