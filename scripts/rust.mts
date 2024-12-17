#!/usr/bin/env zx

// Script for working with Rust projects.

import 'zx/globals';
import {
    getCargo,
    getToolchainArgument,
    parseCliArgumentsV2,
    partitionArgumentsV2,
    popArgument,
    workingDirectory,
} from './helpers/utils.mts';

enum Command {
    Format = 'format',
    LintClippy = 'lint-clippy',
    LintDocs = 'lint-docs',
    LintFeatures = 'lint-features',
    Lint = 'lint',
    Test = 'test',
    Wasm = 'wasm',
    Publish = 'publish',
}

const { command, manifestPath, args } = parseCliArgumentsV2();

async function cargo(
    toolchain: string,
    command: string | string[],
    defaultArgs?: string[],
    variables?: [string, string][],
) {
    const [cargoArgs, commandArgs] = partitionArgumentsV2(args, '--', defaultArgs);
    variables?.forEach(([k, v]) => $.env[k] = v);
    await $`cargo ${toolchain} ${command} --manifest-path ${manifestPath} ${cargoArgs} -- ${commandArgs}`;
}

async function format() {
    return cargo(
        getToolchainArgument('format'),
        'fmt',
        popArgument(args, '--fix') ? [] : ['--', '--check'],
    );
}

async function lintClippy() {
    return cargo(
        getToolchainArgument('lint'),
        'clippy',
        popArgument(args, '--fix') ? ['--fix'] : [],
    );
}

async function lintDocs() {
    return cargo(
        getToolchainArgument('lint'),
        'doc',
        ['--all-features', '--no-deps'],
        [['RUSTDOCFLAGS', '--cfg docsrs -D warnings']],
    );
}

async function lintFeatures() {
    return cargo(
        getToolchainArgument('lint'),
        ['hack', 'check'],
        ['--feature-powerset', '--all-targets'],
    );
}

async function test() {
    return cargo(
        getToolchainArgument('test'),
        'test',
        ['--all-features'],
        [['SBF_OUT_DIR', path.join(workingDirectory, 'target', 'deploy')]]
    );
}

async function wasm() {
    await $`wasm-pack build --target nodejs --dev ${path.dirname(manifestPath)} --features bincode ${args}`;
}

async function publish() {
    const dryRun = argv['dry-run'] ?? false;
    const [level] = args;
    if (!level) {
        throw new Error('A version level — e.g. "path" — must be provided.');
    }

    // Go to the client directory and install the dependencies.
    cd(path.dirname(manifestPath));

    // Publish the new version.
    const releaseArgs = dryRun
        ? []
        : ['--no-push', '--no-tag', '--no-confirm', '--execute'];
    await $`cargo release ${level} ${releaseArgs}`;

    // Stop here if this is a dry run.
    if (dryRun) {
        process.exit(0);
    }

    // Get the crate information.
    const toml = getCargo(path.dirname(manifestPath));
    const crateName = toml.package['name'];
    const newVersion = toml.package['version'];

    // Expose the new version to CI if needed.
    if (process.env.CI) {
        await $`echo "new_version=${newVersion}" >> $GITHUB_OUTPUT`;
    }
    
    // Soft reset the last commit so we can create our own commit and tag.
    await $`git reset --soft HEAD~1`;
    
    // Commit the new version.
    await $`git commit -am "Publish ${crateName} v${newVersion}"`;
    
    // Tag the new version.
    await $`git tag -a ${crateName}@v${newVersion} -m "${crateName} v${newVersion}"`;
}


switch (command) {
    case Command.Format:
        await format();
        break;
    case Command.LintClippy:
        await lintClippy();
        break;
    case Command.LintDocs:
        await lintDocs();
        break;
    case Command.LintFeatures:
        await lintFeatures();
        break;
    case Command.Lint:
        await Promise.all([lintClippy(), lintDocs(), lintFeatures()]);
        break;
    case Command.Test:
        await test();
        break;
    case Command.Wasm:
        await wasm();
        break;
    case Command.Publish:
        await publish();
        break;
    default:
        throw new Error(`Unknown command: ${command}`);
}
