#!/usr/bin/env zx
import 'zx/globals';
import {
  cliArguments,
  getToolchainArgument,
  workingDirectory,
} from '../utils.mjs';

const args = cliArguments();
const toolchain = getToolchainArgument('lint');
const manifestPath = path.join(
  workingDirectory,
  'clients',
  'rust',
  'Cargo.toml'
);

await $`RUSTDOCFLAGS="--cfg docsrs -D warnings" cargo ${toolchain} doc --manifest-path ${manifestPath} --all-features --no-deps ${args}`;
