#!/usr/bin/env zx
import 'zx/globals';
import {
  getToolchainArgument,
  parseCliArguments,
  partitionArguments,
  popArgument,
} from '../helpers/utils.mts';

// Extract the crate directory from the command-line arguments.
const { manifestPath, args } = parseCliArguments();
// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...args]
const formatArgs = args;

const fix = popArgument(args, '--fix');
const [cargoArgs, fmtArgs] = partitionArguments(formatArgs, '--');
const toolchain = getToolchainArgument('format');

await $`cargo ${toolchain} fmt --manifest-path ${manifestPath} ${cargoArgs} -- ${fix ? '' : '--check'} ${fmtArgs}`;
