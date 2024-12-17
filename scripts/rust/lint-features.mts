#!/usr/bin/env zx
import 'zx/globals';
import { getToolchainArgument, parseCliArguments } from '../helpers/utils.mts';

// Extract the crate directory from the command-line arguments.
const { manifestPath, args } = parseCliArguments();
// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...args]
const featuresArgs = ['--exclude-features', 'frozen-abi', ...args];
const toolchain = getToolchainArgument('lint');

// Check feature powerset.
await $`cargo ${toolchain} hack check --manifest-path ${manifestPath} --feature-powerset --all-targets ${featuresArgs}`;
