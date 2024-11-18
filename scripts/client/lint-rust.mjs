// Script to lint the Rust client crate.
//
// This script runs the following sub-scripts:
// - lint-rust-clippy.mjs
// - lint-rust-features.mjs
// - lint-rust-docs.mjs

import { cliArguments, workingDirectory } from '../utils.mjs';

const scripts = path.join(workingDirectory, 'scripts', 'client');

// clippy
await $`zx ${path.join(scripts, 'lint-rust-clippy.mjs')}`;
// features
await $`zx ${path.join(scripts, 'lint-rust-features.mjs')}`;
// rustdoc
await $`zx ${path.join(scripts, 'lint-rust-docs.mjs')}`;
