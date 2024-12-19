#!/usr/bin/env zx

// Script for working with JavaScript projects.

import 'zx/globals';
import {
    parseCliArguments,
    partitionArguments,
} from './helpers/utils.mts';

enum Command {
    Format = 'format',
    Lint = 'lint',
    Test = 'test',
    Publish = 'publish',
}

const { command, libraryPath, args } = parseCliArguments();

async function pnpm(
    command: string,
    build = false,
) {
    const [pnpmArgs, commandArgs] = partitionArguments(args, '--');
    cd(libraryPath);
    await $`pnpm install`;
    if (build) {
        await $`pnpm build`;
    }
    await $`pnpm ${command} ${pnpmArgs} -- ${commandArgs}`;
}

async function format() {
    return pnpm('format');
}

async function lint() {
    return pnpm('lint');
}

async function test() {
    // Start the local validator, or restart it if it is already running.
    await $`pnpm validator:restart`;

    // Build the client and run the tests.
    return pnpm('test', true);
}

async function publish() {
    const [level, tag = 'latest'] = args;
    if (!level) {
      throw new Error('A version level — e.g. "path" — must be provided.');
    }

    // Go to the directory and install the dependencies.
    cd(libraryPath);
    await $`pnpm install`;

    // Update the version.
    const versionArgs = [
        '--no-git-tag-version',
        ...(level.startsWith('pre') ? [`--preid ${tag}`] : []),
    ];
    let { stdout } = await $`pnpm version ${level} ${versionArgs}`;
    const newVersion = stdout.slice(1).trim();

    // Expose the new version to CI if needed.
    if (process.env.CI) {
        await $`echo "new_version=${newVersion}" >> $GITHUB_OUTPUT`;
    }
    
    // Publish the package.
    // This will also build the package before publishing (see prepublishOnly script).
    await $`pnpm publish --no-git-checks --tag ${tag}`;
    
    // Commit the new version.
    await $`git commit -am "Publish JS client v${newVersion}"`;
    
    // Tag the new version.
    await $`git tag -a js@v${newVersion} -m "JS client v${newVersion}"`;
}


switch (command) {
    case Command.Format:
        await format();
        break;
    case Command.Lint:
        await lint();
        break;
    case Command.Test:
        await test();
        break;
    case Command.Publish:
        await publish();
        break;
    default:
        throw new Error(`Unknown command: ${command}`);
}
