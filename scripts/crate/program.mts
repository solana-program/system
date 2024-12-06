import { workingDirectory } from '../helpers/utils.mjs';
import { getDefaultCrateEnvironment, type CrateEnvironment } from './index.mts';

export function getProgramCrateEnvironment(): CrateEnvironment {
  return {
    ...getDefaultCrateEnvironment(),
    cratePath: path.join(workingDirectory, 'program'),
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
