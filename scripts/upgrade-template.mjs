#!/usr/bin/env zx
import "zx/globals";

cd("..");
await $`pnpm create solana-program system --address 11111111111111111111111111111111 --default --force`;
cd("system");
await $`git add --all`;
await $`git restore
  --worktree 
  --staged 
  clients/**/src/**/*
  clients/**/src/*
  clients/**/test/**/*
  clients/**/test/*
  clients/**/tests/**/*
  clients/**/tests/*
  program/**/*
  program/*
  scripts/program/*
  scripts/upgrade-template.mjs
`;
