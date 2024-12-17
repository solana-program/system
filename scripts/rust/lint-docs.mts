#!/usr/bin/env zx
import 'zx/globals';
import { getToolchainArgument, parseCliArguments } from '../helpers/utils.mts';

// Extract the crate directory from the command-line arguments.
const { manifestPath, args } = parseCliArguments();
// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...args]
const docArgs = args;
const toolchain = getToolchainArgument('lint');

await $`RUSTDOCFLAGS="--cfg docsrs -D warnings" cargo ${toolchain} doc --manifest-path ${manifestPath} --all-features --no-deps ${docArgs}`;
