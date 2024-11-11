#!/usr/bin/env zx
import 'zx/globals';
import {
  cliArguments,
  getToolchainArgument,
  workingDirectory,
} from '../utils.mjs';

const args = ['--exclude-features', 'frozen-abi', ...cliArguments()];
const toolchain = getToolchainArgument('test');
const manifestPath = path.join(workingDirectory, 'interface', 'Cargo.toml');

// Check feature powerset.
await $`cargo ${toolchain} hack check --manifest-path ${manifestPath} --feature-powerset --no-dev-deps ${args}`;
