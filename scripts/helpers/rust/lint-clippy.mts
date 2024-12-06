#!/usr/bin/env zx
import 'zx/globals';
import { getCrateEnvironmentFromArgs } from '../../crate/index.mts';
import { getToolchainArgument, popArgument } from '../utils.mts';

const [env, cliArguments] = getCrateEnvironmentFromArgs();
const clippyArgs = env.getLintClippyArguments(cliArguments);
const fix = popArgument(clippyArgs, '--fix');

// Note: need to use nightly clippy as frozen-abi proc-macro generates
// a lot of code (frozen-abi is enabled only under nightly due to the
// use of unstable rust feature). Likewise, frozen-abi(-macro) crates'
// unit tests are only compiled under nightly.
const toolchain = getToolchainArgument('lint');

await $`cargo ${toolchain} clippy --manifest-path ${env.manifestPath} ${fix ? '--fix' : ''} ${clippyArgs}`;
