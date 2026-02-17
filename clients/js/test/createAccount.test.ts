import { appendTransactionMessageInstruction, fetchEncodedAccount, generateKeyPairSigner, pipe } from '@solana/kit';
import { createDefaultLocalhostRpcClient } from '@solana/kit-plugins';
import { expect, it } from 'vitest';
import { SYSTEM_PROGRAM_ADDRESS, getCreateAccountInstruction, systemProgram } from '../src';
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

it('creates a new empty account using the generated plugin', async () => {
    // Given a client with the system program plugin installed.
    const client = await createDefaultLocalhostRpcClient().use(systemProgram());
    const space = 42n;
    const [newAccount, lamports] = await Promise.all([
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);

    // When we call createAccount on the plugin.
    await client.system.instructions
        .createAccount({ newAccount, space, lamports, programAddress: SYSTEM_PROGRAM_ADDRESS })
        .sendTransaction();

    // Then we expect the following account data.
    const fetchedAccount = await fetchEncodedAccount(client.rpc, newAccount.address);
    expect(fetchedAccount).toStrictEqual({
        executable: false,
        lamports,
        programAddress: SYSTEM_PROGRAM_ADDRESS,
        address: newAccount.address,
        data: new Uint8Array(Array.from({ length: Number(space) }, () => 0)),
        exists: true,
        space,
    });
});
