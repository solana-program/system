#!/usr/bin/env zx
import 'zx/globals';
import {
  cliArguments,
  getToolchainArgument,
  workingDirectory,
} from '../helpers/utils.mts';

const args = cliArguments();
const toolchain = getToolchainArgument('lint');
const manifestPath = path.join(workingDirectory, 'interface', 'Cargo.toml');

await $`RUSTDOCFLAGS="--cfg docsrs -D warnings" cargo ${toolchain} doc --manifest-path ${manifestPath} --all-features --no-deps ${args}`;
