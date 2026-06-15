# JavaScript client

A generated JavaScript library for the System program.

## Guarded SOL transfers

SOL sent to an account that is not owned by the System Program — most commonly an SPL token mint — is typically unrecoverable. The guarded transfer helpers refuse to build a `transferSol` instruction unless the destination is a valid System-owned recipient: either an account already owned by the System Program, or a not-yet-created on-curve address.

Using the `systemProgram()` client plugin:

```ts
// Throws InvalidTransferSolDestinationError if `destination` is not a valid recipient.
await client.system.instructions.transferSolGuarded({ source, destination, amount }).sendTransaction();
```

Or build the instruction (or validate a destination) directly:

```ts
import { assertValidTransferSolDestination, getTransferSolGuardedInstruction } from '@solana-program/system';

const instruction = await getTransferSolGuardedInstruction(rpc, { source, destination, amount });

// Validate a destination on its own, e.g. as a user types it.
await assertValidTransferSolDestination(rpc, destination);
```

Pass `{ allowOffCurve: true }` to permit funding a not-yet-created off-curve address (a program-derived address).

## Getting started

The JS client tests use [LiteSVM](https://github.com/LiteSVM/litesvm) in-process, so no local validator is needed. From the root of the repository:

```sh
make test-js-clients-js
```

This installs dependencies, builds the client, and runs the test suite.

## Available client scripts

Alternatively, you can go into the client directory and run the scripts directly.

```sh
cd clients/js
pnpm install
pnpm build
pnpm test
```

You may also use the following scripts to lint and/or format your JavaScript client.

```sh
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:fix
```

Equivalent `make` targets from the repo root are `make lint-js-clients-js` and `make format-check-js-clients-js`.
