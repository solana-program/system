#!/usr/bin/env zx

// Script for working with JavaScript projects.

import 'zx/globals';
import {
    parseCliArguments,
    partitionArguments,
} from './helpers/utils.mts';

enum Command {
    Publish = 'publish',
}

const { command, libraryPath, args } = parseCliArguments();

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
    case Command.Publish:
        await publish();
        break;
    default:
        throw new Error(`Unknown command: ${command}`);
}
