export type CrateEnvironment = {
  getLintClippyArgs: () => string[];
  getLintDocsArgs: () => string[];
  // ...
};

// getCrateEnvironment("interface").getLintClippyArgs();

export function getCrateEnvironment(crate: string): CrateEnvironment {
  switch (crate) {
    case 'interface':
      return getInterfaceCrateEnvironment();
    default:
      throw new Error(`Unknown crate: ${crate}`);
  }
}

// interface.mjs
export function getInterfaceCrateEnvironment(): CrateEnvironment {
  return {
    getLintClippyArgs: () => ['--all-targets'],
    getLintDocsArgs: () => ['--all-targets'],
    // ...
  };
}

// the others...
