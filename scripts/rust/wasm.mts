#!/usr/bin/env zx
import 'zx/globals';
import { cliArguments, workingDirectory } from '../helpers/utils.mts';

// Configure additional arguments here, e.g.:
// ['--arg1', '--arg2', ...cliArguments()]
const buildArgs = cliArguments();
const cratePath = path.join(workingDirectory, 'interface');

// Build the interface.
await $`wasm-pack build --target nodejs --dev ${cratePath} --features bincode ${buildArgs}`;
