#!/usr/bin/env zx
import 'zx/globals';
import { getCrateEnvironmentFromArgs } from '../../crate/index.mts';
import {
  getToolchainArgument,
  partitionArguments,
  popArgument,
} from '../utils.mts';

const [env, cliArguments] = getCrateEnvironmentFromArgs();
const args = env.getFormatArguments(cliArguments);

const fix = popArgument(args, '--fix');
const [cargoArgs, fmtArgs] = partitionArguments(args, '--');
const toolchain = getToolchainArgument('format');

await $`cargo ${toolchain} fmt --manifest-path ${env.manifestPath} ${cargoArgs} -- ${fix ? '' : '--check'} ${fmtArgs}`;
