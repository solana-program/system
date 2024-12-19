// Script to lint a crate.
//
// This script runs the following sub-scripts:
// - lint-clippy.mjs
// - lint-docs.mjs
// - lint-features.mjs

import { cliArguments, workingDirectory } from '../helpers/utils.mts';

const scripts = path.join(workingDirectory, 'scripts', 'rust');

// clippy
await $`tsx ${path.join(scripts, 'lint-clippy.mjs')} ${cliArguments()}`;
// rustdoc
await $`tsx ${path.join(scripts, 'lint-docs.mjs')} ${cliArguments()}`;
// features
await $`tsx ${path.join(scripts, 'lint-features.mjs')} ${cliArguments()}`;
