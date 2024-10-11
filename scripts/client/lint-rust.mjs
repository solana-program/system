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
const lintArgs = cliArguments();

const fix = popArgument(lintArgs, '--fix');
const toolchain = getToolchainArgument('lint');
const manifests = [
  path.join(workingDirectory, 'clients', 'rust-client', 'Cargo.toml'),
  path.join(workingDirectory, 'clients', 'rust-instruction', 'Cargo.toml'),
];

// Check the client using Clippy.
for (const client of manifests) {
  if (fix) {
    await $`cargo ${toolchain} clippy --manifest-path ${client} --fix ${lintArgs}`;
  } else {
    await $`cargo ${toolchain} clippy --manifest-path ${client} ${lintArgs}`;
  }
}
