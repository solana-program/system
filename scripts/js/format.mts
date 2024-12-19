#!/usr/bin/env zx
import 'zx/globals';
import { cliArguments, workingDirectory } from '../helpers/utils.mts';

// Format the client using Prettier.
cd(path.join(workingDirectory, 'clients', 'js'));
await $`pnpm install`;
await $`pnpm format ${cliArguments()}`;
