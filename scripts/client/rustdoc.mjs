#!/usr/bin/env zx
import 'zx/globals';
import { cliArguments, workingDirectory } from '../utils.mjs';

const args = cliArguments();
const manifestPath = path.join(
  workingDirectory,
  'clients',
  'rust',
  'Cargo.toml'
);

await $`RUSTDOCFLAGS="--cfg docsrs -D warnings" cargo doc --manifest-path ${manifestPath} --all-features --no-deps ${args}`;
