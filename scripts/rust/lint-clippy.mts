#!/usr/bin/env zx
import 'zx/globals';
import {
  getToolchainArgument,
  popArgument,
  workingDirectory,
} from '../helpers/utils.mts';
import {
  getCrateEnvironment,
  getCrateEnvironmentFromArgs,
} from '../crate/index.mts';

const [env, cliArguments] = getCrateEnvironmentFromArgs();
const lintArgs = env.getLintClippyArguments(cliArguments);
const fix = popArgument(lintArgs, '--fix');

// Note: need to use nightly clippy as frozen-abi proc-macro generates
// a lot of code (frozen-abi is enabled only under nightly due to the
// use of unstable rust feature). Likewise, frozen-abi(-macro) crates'
// unit tests are only compiled under nightly.
const toolchain = getToolchainArgument('lint');

// Lint the interface.
await $`cargo ${toolchain} clippy --manifest-path ${env.manifestPath} ${fix ? '--fix' : ''} ${lintArgs}`;
