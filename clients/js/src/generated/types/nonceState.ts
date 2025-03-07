/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getEnumDecoder,
  getEnumEncoder,
  getU32Decoder,
  getU32Encoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';

export enum NonceState {
  Uninitialized,
  Initialized,
}

export type NonceStateArgs = NonceState;

export function getNonceStateEncoder(): Encoder<NonceStateArgs> {
  return getEnumEncoder(NonceState, { size: getU32Encoder() });
}

export function getNonceStateDecoder(): Decoder<NonceState> {
  return getEnumDecoder(NonceState, { size: getU32Decoder() });
}

export function getNonceStateCodec(): Codec<NonceStateArgs, NonceState> {
  return combineCodec(getNonceStateEncoder(), getNonceStateDecoder());
}
