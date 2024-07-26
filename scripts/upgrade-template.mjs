#!/usr/bin/env zx
import "zx/globals";

$.quote = (command) => command;
const unchangedPaths = [
  "clients/**/src/**/*",
  "clients/**/src/*",
  "clients/js/test/*",
  "clients/rust/tests/*",
  "program/**/*",
  "program/*",
  "scripts/program/*",
  "scripts/upgrade-template.mjs",
];

cd("..");
await $`pnpm create solana-program system --address 11111111111111111111111111111111 --default --force`;
cd("system");
await $`git add --all && git restore --worktree --staged ${unchangedPaths}`;
