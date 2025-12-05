import { Account, appendTransactionMessageInstruction, generateKeyPairSigner, pipe } from '@solana/kit';
import { it, expect } from 'vitest';
import {
    Nonce,
    NonceState,
    NonceVersion,
    SYSTEM_PROGRAM_ADDRESS,
    fetchNonce,
    getCreateAccountInstruction,
    getInitializeNonceAccountInstruction,
    getNonceSize,
} from '../src';
import {
    createDefaultSolanaClient,
    createDefaultTransaction,
    generateKeyPairSignerWithSol,
    signAndSendTransaction,
} from './_setup';

it('creates and initialize a durable nonce account', async () => {
    // Given some brand now payer, authority, and nonce KeyPairSigners.
    const client = createDefaultSolanaClient();
    const payer = await generateKeyPairSignerWithSol(client);
    const nonce = await generateKeyPairSigner();
    const nonceAuthority = await generateKeyPairSigner();

    // When we use them to create and initialize a nonce account.
    const space = BigInt(getNonceSize());
    const rent = await client.rpc.getMinimumBalanceForRentExemption(space).send();
    const createAccount = getCreateAccountInstruction({
        payer,
        newAccount: nonce,
        lamports: rent,
        space,
        programAddress: SYSTEM_PROGRAM_ADDRESS,
    });
    const initializeNonceAccount = getInitializeNonceAccountInstruction({
        nonceAccount: nonce.address,
        nonceAuthority: nonceAuthority.address,
    });
    await pipe(
        await createDefaultTransaction(client, payer),
        tx => appendTransactionMessageInstruction(createAccount, tx),
        tx => appendTransactionMessageInstruction(initializeNonceAccount, tx),
        tx => signAndSendTransaction(client, tx),
    );

    // Then we expect the nonce account to exist with the following data.
    expect(await fetchNonce(client.rpc, nonce.address)).toMatchObject(<Account<Nonce>>{
        address: nonce.address,
        data: {
            version: NonceVersion.Current,
            state: NonceState.Initialized,
            authority: nonceAuthority.address,
        },
    });
});
