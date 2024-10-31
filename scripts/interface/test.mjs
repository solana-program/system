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
const toolchain = getToolchainArgument('test');
const manifestPath = path.join(workingDirectory, 'interface', 'Cargo.toml');

// Test the interface.
await $`cargo ${toolchain} test --all-features --manifest-path ${manifestPath} ${buildArgs}`;
