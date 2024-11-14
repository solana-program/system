// Script to lint the interface crate.
//
// This script runs the following sub-scripts:
// - lint-clippy.mjs
// - lint-features.mjs
// - lint-docs.mjs
//
// Command line arguments are only passed to clippy.

import { cliArguments, popArgument, workingDirectory } from '../utils.mjs';

const scripts = path.join(workingDirectory, 'scripts', 'interface');

// clippy
await $`zx ${path.join(scripts, 'lint-clippy.mjs')} ${cliArguments()}`;
// features
await $`zx ${path.join(scripts, 'lint-features.mjs')}`;
// rustdoc
await $`zx ${path.join(scripts, 'lint-docs.mjs')}`;
