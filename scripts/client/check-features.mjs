#!/usr/bin/env zx
import 'zx/globals';
import { cliArguments, workingDirectory } from '../utils.mjs';

const args = cliArguments();
const toolchain = getToolchainArgument('test');
const manifestPath = path.join(
  workingDirectory,
  'clients',
  'rust',
  'Cargo.toml'
);

// Check feature powerset.
await $`cargo ${toolchain} hack check --manifest-path ${manifestPath} --feature-powerset --all-targets ${args}`;
