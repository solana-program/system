import { generateKeyPairSigner } from '@solana/kit';
import { expect, it } from 'vitest';
import { NonceState, NonceVersion, SYSTEM_PROGRAM_ADDRESS, getNonceSize } from '../src';
import { createClient } from './_setup';

it('creates and initialize a durable nonce account', async () => {
    // Given some brand new authority, and nonce KeyPairSigners.
    const client = await createClient();
    const space = BigInt(getNonceSize());
    const [nonce, nonceAuthority, rent] = await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);

    // When we use them to create and initialize a nonce account.
    await client.sendTransaction([
        client.system.instructions.createAccount({
            newAccount: nonce,
            lamports: rent,
            space,
            programAddress: SYSTEM_PROGRAM_ADDRESS,
        }),
        client.system.instructions.initializeNonceAccount({
            nonceAccount: nonce.address,
            nonceAuthority: nonceAuthority.address,
        }),
    ]);

    // Then we expect the nonce account to exist with the following data.
    const nonceAccount = await client.system.accounts.nonce.fetch(nonce.address);
    expect(nonceAccount).toMatchObject({
        address: nonce.address,
        data: {
            version: NonceVersion.Current,
            state: NonceState.Initialized,
            authority: nonceAuthority.address,
        },
    });
});
