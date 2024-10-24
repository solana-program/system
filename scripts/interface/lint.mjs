#!/usr/bin/env zx
import 'zx/globals';
import {
  cliArguments,
  getToolchainArgument,
  popArgument,
  workingDirectory,
} from '../utils.mjs';

// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...cliArguments()]
const lintArgs = ['--features', 'frozen-abi', ...cliArguments()];
// Check whether a '--' was already used.
if (lintArgs.indexOf('--') === -1) {
  lintArgs.push('--');
}
// Add additional arguments.
lintArgs.push(
  '--deny=warnings',
  '--deny=clippy::default_trait_access',
  '--deny=clippy::arithmetic_side_effects',
  '--deny=clippy::manual_let_else',
  '--deny=clippy::used_underscore_binding'
);

const fix = popArgument(lintArgs, '--fix');
const toolchain = getToolchainArgument('lint');
const manifestPath = path.join(workingDirectory, 'interface', 'Cargo.toml');

// Use nightly clippy, as frozen-abi proc-macro generates a lot of code across
// various crates in this whole monorepo (frozen-abi is enabled only under nightly
// due to the use of unstable rust feature). Likewise, frozen-abi(-macro) crates'
// unit tests are only compiled under nightly.
if (fix) {
  await $`cargo ${toolchain} clippy --manifest-path ${manifestPath} --fix ${lintArgs}`;
} else {
  await $`cargo ${toolchain} clippy --manifest-path ${manifestPath} ${lintArgs}`;
}
