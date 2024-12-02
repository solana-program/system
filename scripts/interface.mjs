import { cliArguments, workingDirectory } from './helpers/utils.mjs';

export const manifestPath = path.join(
  workingDirectory,
  'interface',
  'Cargo.toml'
);

export function getLintClippyArguments() {
  const args = ['--all-targets', '--all-features', ...cliArguments()];
  // Check whether a '--' was already used.
  if (args.indexOf('--') === -1) {
    args.push('--');
  }
  // Add additional arguments.
  args.push(
    '--deny=warnings',
    '--deny=clippy::default_trait_access',
    '--deny=clippy::arithmetic_side_effects',
    '--deny=clippy::manual_let_else',
    '--deny=clippy::used_underscore_binding'
  );
  return args;
}

export function getLintDocsArguments() {
  return cliArguments();
}

export function getLintFeaturesArguments() {
}
