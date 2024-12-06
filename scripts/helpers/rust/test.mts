#!/usr/bin/env zx
import 'zx/globals';
import { getCrateEnvironmentFromArgs } from '../../crate/index.mts';
import { getToolchainArgument } from '../utils.mts';

const [env, cliArguments] = getCrateEnvironmentFromArgs();
const testArgs = env.getTestArguments(cliArguments);
const toolchain = getToolchainArgument('test');

// Test the interface.
await $`cargo ${toolchain} test --all-features --manifest-path ${env.manifestPath} ${testArgs}`;
