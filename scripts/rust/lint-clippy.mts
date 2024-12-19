#!/usr/bin/env zx
import 'zx/globals';
import {
  getToolchainArgument,
  parseCliArguments,
  popArgument,
} from '../helpers/utils.mts';

// Extract the crate directory from the command-line arguments.
const { manifestPath, args } = parseCliArguments();
// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...args]
const clippyArgs = args;
// Note: need to use nightly clippy as frozen-abi proc-macro generates
// a lot of code (frozen-abi is enabled only under nightly due to the
// use of unstable rust feature). Likewise, frozen-abi(-macro) crates'
// unit tests are only compiled under nightly.
const toolchain = getToolchainArgument('lint');
// Check if the `--fix` argument is present.
const fix = popArgument(clippyArgs, '--fix');

await $`cargo ${toolchain} clippy --manifest-path ${manifestPath} ${fix ? '--fix' : ''} ${clippyArgs}`;
