#!/usr/bin/env zx
import 'zx/globals';
import { getCrateEnvironmentFromArgs } from '../../crate/index.mts';
import { getToolchainArgument } from '../utils.mts';

const [env, cliArguments] = getCrateEnvironmentFromArgs();
const docArgs = env.getLintDocsArguments(cliArguments);
const toolchain = getToolchainArgument('lint');

await $`RUSTDOCFLAGS="--cfg docsrs -D warnings" cargo ${toolchain} doc --manifest-path ${env.manifestPath} --all-features --no-deps ${docArgs}`;
