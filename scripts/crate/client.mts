import { workingDirectory } from '../helpers/utils.mjs';
import { getDefaultCrateEnvironment, type CrateEnvironment } from './index.mts';

export function getClientCrateEnvironment(): CrateEnvironment {
  return {
    ...getDefaultCrateEnvironment(),
    cratePath: path.join(workingDirectory, 'clients', 'rust'),
    manifestPath: path.join(workingDirectory, 'clients', 'rust', 'Cargo.toml'),
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
