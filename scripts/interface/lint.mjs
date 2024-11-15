// Script to lint the interface crate.
//
// This script runs the following sub-scripts:
// - lint-clippy.mjs
// - lint-features.mjs
// - lint-docs.mjs

import { workingDirectory } from '../utils.mjs';

const scripts = path.join(workingDirectory, 'scripts', 'interface');

// clippy
await $`zx ${path.join(scripts, 'lint-clippy.mjs')}`;
// features
await $`zx ${path.join(scripts, 'lint-features.mjs')}`;
// rustdoc
await $`zx ${path.join(scripts, 'lint-docs.mjs')}`;
