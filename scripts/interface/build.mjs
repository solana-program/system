#!/usr/bin/env zx
import 'zx/globals';
import {
  cliArguments,
  getToolchainArgument,
  workingDirectory,
} from '../utils.mjs';

// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...cliArguments()]
const buildArgs = cliArguments();
const toolchain = getToolchainArgument('build');
const manifestPath = path.join(workingDirectory, 'interface', 'Cargo.toml');

// Build the programs.
await $`cargo ${toolchain} build --all-features --manifest-path ${manifestPath} ${buildArgs}`;
