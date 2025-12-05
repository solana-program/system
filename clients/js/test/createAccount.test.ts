import { appendTransactionMessageInstruction, fetchEncodedAccount, generateKeyPairSigner, pipe } from '@solana/kit';
import { it, expect } from 'vitest';
import { SYSTEM_PROGRAM_ADDRESS, getCreateAccountInstruction } from '../src';
import {
    createDefaultSolanaClient,
    createDefaultTransaction,
    generateKeyPairSignerWithSol,
    signAndSendTransaction,
} from './_setup';

it('creates a new empty account', async () => {
    // Given we have a newly generated account keypair to create with 42 bytes of space.
    const client = createDefaultSolanaClient();
    const space = 42n;
    const [payer, newAccount, lamports] = await Promise.all([
        generateKeyPairSignerWithSol(client),
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);

    // When we call createAccount in a transaction.
    const createAccount = getCreateAccountInstruction({
        payer,
        newAccount,
        space,
        lamports,
        programAddress: SYSTEM_PROGRAM_ADDRESS,
    });
    await pipe(
        await createDefaultTransaction(client, payer),
        tx => appendTransactionMessageInstruction(createAccount, tx),
        tx => signAndSendTransaction(client, tx),
    );

    // Then we expect the following account data.
    const fetchedAccount = await fetchEncodedAccount(client.rpc, newAccount.address);
    expect(fetchedAccount).toStrictEqual({
        executable: false,
        lamports,
        programAddress: SYSTEM_PROGRAM_ADDRESS,
        address: newAccount.address,
        data: new Uint8Array(Array.from({ length: 42 }, () => 0)),
        exists: true,
        space: 42n,
    });
});
