import { workingDirectory } from '../helpers/utils.mjs';
import type { CrateEnvironment } from './index.mts';

export function getProgramCrateEnvironment(): CrateEnvironment {
  return {
    manifestPath: path.join(workingDirectory, 'program', 'Cargo.toml'),
    getLintClippyArguments,
    getLintDocsArguments,
    getLintFeaturesArguments,
  };
}

function getLintClippyArguments(cliArguments: string[]): string[] {
  return cliArguments; // TODO
}

function getLintDocsArguments(cliArguments: string[]): string[] {
  return cliArguments; // TODO
}

function getLintFeaturesArguments(cliArguments: string[]): string[] {
  return cliArguments; // TODO
}
