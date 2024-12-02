import { cliArguments, workingDirectory } from '../helpers/utils.mjs';
import type { CrateEnvironment } from './index.mts';

export function getInterfaceCrateEnvironment(): CrateEnvironment {
  return {
    manifestPath: path.join(workingDirectory, 'interface', 'Cargo.toml'),
    getLintClippyArguments,
    getLintDocsArguments,
    getLintFeaturesArguments,
  };
}

function getLintClippyArguments(cliArguments: string[]): string[] {
  const args = ['--all-targets', '--all-features', ...cliArguments];
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

function getLintDocsArguments(cliArguments: string[]): string[] {
  return cliArguments; // TODO
}

function getLintFeaturesArguments(cliArguments: string[]): string[] {
  return cliArguments; // TODO
}
