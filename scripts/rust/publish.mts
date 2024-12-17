#!/usr/bin/env zx
import 'zx/globals';
import { getCargo, parseCliArguments } from '../helpers/utils.mts';

// Extract the crate directory from the command-line arguments.
const { manifestPath, args } = parseCliArguments();

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
