// Script to lint the interface crate.
//
// This script runs the following sub-scripts:
// - lint-format.mjs
// - lint-clippy.mjs
// - lint-features.mjs
// - lint-docs.mjs
//
// Command line arguments are not passed to the sub-scripts, apart from `--fix`
// which is passed to lint-format.mjs and lint-clippy.mjs.

import { cliArguments, popArgument, workingDirectory } from '../utils.mjs';

const scripts = path.join(workingDirectory, 'scripts', 'interface');

// We only need to pass `--fix` to the format and clippy linters. The other
// arguments are filtered out since tey might not be supported by all sub-scripts.
const args = cliArguments();
const fix = popArgument(args, '--fix');

// format
await $`zx ${path.join(scripts, 'lint-format.mjs')} ${fix ? '--fix' : ''}`;
// clippy
await $`zx ${path.join(scripts, 'lint-clippy.mjs')} ${fix ? '--fix' : ''}`;
// features
await $`zx ${path.join(scripts, 'lint-features.mjs')}`;
// rustdoc
await $`zx ${path.join(scripts, 'lint-docs.mjs')}`;
