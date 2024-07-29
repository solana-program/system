#!/usr/bin/env zx
import "zx/globals";

$.quote = (command) => command;
const unchangedGlobs = [
  "clients/**/src/**",
  "clients/**/src/*",
  "clients/js/test/*",
  "clients/rust/tests/*",
  "program/**/*",
  "program/*",
  "scripts/generate-clients.mjs",
  "scripts/generate-idls.mjs",
  "scripts/upgrade-template.mjs",
  "scripts/program/*",
];

cd("..");
await $`pnpm create solana-program system --address 11111111111111111111111111111111 --default --force`;
cd("system");
await $`git add --all`;
for (const glob of unchangedGlobs) {
  await $`git restore --worktree --staged "${glob}"`;
}
await $`pnpm install`;
