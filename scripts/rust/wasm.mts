#!/usr/bin/env zx
import 'zx/globals';
import { parseCliArguments } from '../helpers/utils.mts';

// Extract the crate directory from the command-line arguments.
const { manifestPath, args } = parseCliArguments();
// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...args]
const wasmArgs = args;

await $`wasm-pack build --target nodejs --dev ${path.dirname(manifestPath)} --features bincode ${wasmArgs}`;
