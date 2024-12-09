import { cliArguments } from '../helpers/utils.mts';
import { getClientCrateEnvironment } from './client.mts';
import { getInterfaceCrateEnvironment } from './interface.mts';
import { getProgramCrateEnvironment } from './program.mts';

export type CrateEnvironment = {
  getFormatArguments: (cliArguments: string[]) => string[];
  getLintClippyArguments: (cliArguments: string[]) => string[];
  getLintDocsArguments: (cliArguments: string[]) => string[];
  getLintFeaturesArguments: (cliArguments: string[]) => string[];
  getPublishArguments: (cliArguments: string[]) => string[];
  getTestArguments: (cliArguments: string[]) => string[];
  getWasmArguments: (cliArguments: string[]) => string[];
  cratePath: string;
  manifestPath: string;
};

type Crate = 'interface' | 'client' | 'program';

export function getCrateEnvironmentFromArgs(): [CrateEnvironment, string[]] {
  const crate = process.argv[2] as Crate;
  return [getCrateEnvironment(crate), cliArguments().slice(1)];
}

export function getCrateEnvironment(crate: Crate): CrateEnvironment {
  switch (crate) {
    case 'client':
      return getClientCrateEnvironment();
    case 'interface':
      return getInterfaceCrateEnvironment();
    case 'program':
      return getProgramCrateEnvironment();
    default:
      throw new Error(`Unknown crate: ${crate}`);
  }
}

const getCliArguments = (args: string[]): string[] => {
  return args;
};

export function getDefaultCrateEnvironment(): CrateEnvironment {
  return {
    getFormatArguments: getCliArguments,
    getLintClippyArguments: getCliArguments,
    getLintDocsArguments: getCliArguments,
    getLintFeaturesArguments: getCliArguments,
    getPublishArguments: getCliArguments,
    getTestArguments: getCliArguments,
    getWasmArguments: getCliArguments,
    cratePath: '',
    manifestPath: '',
  } as CrateEnvironment;
}
