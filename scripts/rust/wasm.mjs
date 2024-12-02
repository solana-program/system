#!/usr/bin/env zx
import 'zx/globals';
import {
  cliArguments,
  workingDirectory,
} from '../utils.mjs';

// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...cliArguments()]
const buildArgs = cliArguments();
const cratePath = path.join(workingDirectory, 'interface');

// Build the interface.
await $`wasm-pack build --target nodejs --dev ${cratePath} --features bincode ${buildArgs}`;
