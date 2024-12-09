#!/usr/bin/env zx
import 'zx/globals';
import { getCrateEnvironmentFromArgs } from '../../crate/index.mts';

const [env, cliArguments] = getCrateEnvironmentFromArgs();
const wasmArgs = env.getWasmArguments(cliArguments);

await $`wasm-pack build --target nodejs --dev ${env.cratePath} --features bincode ${wasmArgs}`;
