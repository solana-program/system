import {
    appendTransactionMessageInstruction,
    createAddressWithSeed,
    fetchEncodedAccount,
    generateKeyPairSigner,
    pipe,
} from '@solana/kit';
import test from 'ava';
import { getCreateAccountWithSeedInstruction } from '../src';
import {
    createDefaultSolanaClient,
    createDefaultTransaction,
    generateKeyPairSignerWithSol,
    signAndSendTransaction,
} from './_setup';

test('it creates a new empty account when base is not payer', async t => {
    const client = createDefaultSolanaClient();
    const space = 42n;
    const [payer, program, lamports] = await Promise.all([
        generateKeyPairSignerWithSol(client),
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);
    const baseAccount = await generateKeyPairSigner();

    const programAddress = program.address;
    const SEED = '123456789';
    const newAccount = await createAddressWithSeed({
        baseAddress: baseAccount.address,
        programAddress,
        seed: SEED,
    });

    // When we call createAccountWithSeed in a transaction.
    const createAccount = getCreateAccountWithSeedInstruction({
        payer,
        newAccount,
        baseAccount,
        base: baseAccount.address,
        seed: SEED,
        space,
        amount: lamports,
        programAddress,
    });
    await pipe(
        await createDefaultTransaction(client, payer),
        tx => appendTransactionMessageInstruction(createAccount, tx),
        tx => signAndSendTransaction(client, tx),
    );

    // Then we expect the following account data.
    const fetchedAccount = await fetchEncodedAccount(client.rpc, newAccount);
    t.deepEqual(fetchedAccount, {
        executable: false,
        lamports,
        programAddress,
        address: newAccount,
        data: new Uint8Array(Array.from({ length: 42 }, () => 0)),
        exists: true,
        space: 42n,
    });
});

test('it creates a new empty account when base is payer', async t => {
    const client = createDefaultSolanaClient();
    const space = 42n;
    const [payer, program, lamports] = await Promise.all([
        generateKeyPairSignerWithSol(client),
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);
    const baseAddress = payer.address;

    const programAddress = program.address;
    const SEED = '123456789';
    const newAccount = await createAddressWithSeed({
        baseAddress,
        programAddress,
        seed: SEED,
    });

    // When we call createAccountWithSeed in a transaction.
    const createAccount = getCreateAccountWithSeedInstruction({
        payer,
        newAccount,
        base: baseAddress,
        seed: SEED,
        space,
        amount: lamports,
        programAddress,
    });
    await pipe(
        await createDefaultTransaction(client, payer),
        tx => appendTransactionMessageInstruction(createAccount, tx),
        tx => signAndSendTransaction(client, tx),
    );

    // Then we expect the following account data.
    const fetchedAccount = await fetchEncodedAccount(client.rpc, newAccount);
    t.deepEqual(fetchedAccount, {
        executable: false,
        lamports,
        programAddress,
        address: newAccount,
        data: new Uint8Array(Array.from({ length: 42 }, () => 0)),
        exists: true,
        space: 42n,
    });
});
