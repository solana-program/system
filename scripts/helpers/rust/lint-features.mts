#!/usr/bin/env zx
import 'zx/globals';
import { getCrateEnvironmentFromArgs } from '../../crate/index.mts';
import { getToolchainArgument } from '../utils.mts';

const [env, cliArguments] = getCrateEnvironmentFromArgs();
const featuresArgs = env.getLintDocsArguments(cliArguments);
const toolchain = getToolchainArgument('lint');

// Check feature powerset.
await $`cargo ${toolchain} hack check --manifest-path ${env.manifestPath} --feature-powerset --all-targets ${featuresArgs}`;
