#!/usr/bin/env zx
import "zx/globals";

cd("..");
await $`pnpm create solana-program system --address 11111111111111111111111111111111 --default --force`;
cd("system");
await $`git restore program clients/**/generated`;
