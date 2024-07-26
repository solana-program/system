#!/usr/bin/env zx
import "zx/globals";

const unchangedPaths = [
  "clients/**/src/**/*",
  "clients/**/src/*",
  "clients/**/test/**/*",
  "clients/**/test/*",
  "clients/**/tests/**/*",
  "clients/**/tests/*",
  "program/**/*",
  "program/*",
  "scripts/program/*",
  "scripts/upgrade-template.mjs",
];

cd("..");
await $`pnpm create solana-program system --address 11111111111111111111111111111111 --default --force`;
cd("system");
await $`git add --all && git restore --worktree --staged ${unchangedPaths}`;
