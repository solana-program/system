import { cliArguments } from '../helpers/utils.mts';
import { getClientCrateEnvironment } from './client.mts';
import { getInterfaceCrateEnvironment } from './interface.mts';
import { getProgramCrateEnvironment } from './program.mts';

export type CrateEnvironment = {
  getLintClippyArguments: (cliArguments: string[]) => string[];
  getLintDocsArguments: (cliArguments: string[]) => string[];
  getLintFeaturesArguments: (cliArguments: string[]) => string[];
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
