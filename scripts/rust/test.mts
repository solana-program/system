#!/usr/bin/env zx
import 'zx/globals';
import {
  getToolchainArgument,
  parseCliArguments,
  workingDirectory,
} from '../helpers/utils.mts';

// Extract the crate directory from the command-line arguments.
const { manifestPath, args } = parseCliArguments();
// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...args]
const testArgs = args;

const toolchain = getToolchainArgument('test');

const hasSolfmt = await which('solfmt', { nothrow: true });
const sbfOutDir = path.join(workingDirectory, 'target', 'deploy');

// Run the tests.
if (hasSolfmt) {
  await $`SBF_OUT_DIR=${sbfOutDir} cargo ${toolchain} test --all-features --manifest-path ${manifestPath} ${testArgs} >&1 | solfmt`;
} else {
  await $`SBF_OUT_DIR=${sbfOutDir} cargo ${toolchain} test --all-features --manifest-path ${manifestPath} ${testArgs}`;
}
