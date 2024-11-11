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

// Check feature powerset.
await $`cargo hack check --manifest-path ${manifestPath} --feature-powerset --no-dev-deps ${args}`;
