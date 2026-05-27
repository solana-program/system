# JavaScript client

A generated JavaScript library for the System program.

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
