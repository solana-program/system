#!/usr/bin/env zx
import 'zx/globals';
import { cliArguments, workingDirectory } from '../utils.mts';

// Check the client using ESLint.
cd(path.join(workingDirectory, 'clients', 'js'));
await $`pnpm install`;
await $`pnpm lint ${cliArguments()}`;
