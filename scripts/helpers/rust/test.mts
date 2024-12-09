#!/usr/bin/env zx
import 'zx/globals';
import { getCrateEnvironmentFromArgs } from '../../crate/index.mts';
import { getToolchainArgument, workingDirectory } from '../utils.mts';

const [env, cliArguments] = getCrateEnvironmentFromArgs();
const testArgs = env.getTestArguments(cliArguments);
const toolchain = getToolchainArgument('test');

const hasSolfmt = await which('solfmt', { nothrow: true });
const sbfOutDir = path.join(workingDirectory, 'target', 'deploy');

// Run the tests.
if (hasSolfmt) {
    await $`SBF_OUT_DIR=${sbfOutDir} cargo ${toolchain} test --all-features --manifest-path ${env.manifestPath} ${testArgs} >&1 | solfmt`;
} else {
    await $`SBF_OUT_DIR=${sbfOutDir} cargo ${toolchain} test --all-features --manifest-path ${env.manifestPath} ${testArgs}`;
}
