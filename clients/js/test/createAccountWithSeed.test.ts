import { createAddressWithSeed, fetchEncodedAccount, generateKeyPairSigner } from '@solana/kit';
import { expect, it } from 'vitest';
import { createClient } from './_setup';

it('creates a new empty account when base is not payer', async () => {
    // Given a program, a base account, and an address derived from them with a seed.
    const client = await createClient();
    const space = 42n;
    const [program, baseAccount, rent] = await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);
    const seed = '123456789';
    const newAccount = await createAddressWithSeed({
        baseAddress: baseAccount.address,
        programAddress: program.address,
        seed,
    });

    // When we create a new account for this address derived from a seed.
    await client.system.instructions
        .createAccountWithSeed({
            newAccount,
            baseAccount,
            base: baseAccount.address,
            seed,
            space,
            amount: rent,
            programAddress: program.address,
        })
        .sendTransaction();

    // Then we expect the following account data.
    const fetchedAccount = await fetchEncodedAccount(client.rpc, newAccount);
    expect(fetchedAccount).toStrictEqual({
        executable: false,
        lamports: rent,
        programAddress: program.address,
        address: newAccount,
        data: new Uint8Array(Array.from({ length: 42 }, () => 0)),
        exists: true,
        space: 42n,
    });
});

it('creates a new empty account when base is payer', async () => {
    // Given a program and an address derived from the program and the payer with a seed.
    const client = await createClient();
    const space = 42n;
    const [program, rent] = await Promise.all([
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);
    const seed = '123456789';
    const newAccount = await createAddressWithSeed({
        baseAddress: client.payer.address,
        programAddress: program.address,
        seed,
    });

    // When we create a new account for this address derived from a seed.
    await client.system.instructions
        .createAccountWithSeed({
            newAccount,
            base: client.payer.address,
            seed,
            space,
            amount: rent,
            programAddress: program.address,
        })
        .sendTransaction();

    // Then we expect the following account data.
    const fetchedAccount = await fetchEncodedAccount(client.rpc, newAccount);
    expect(fetchedAccount).toStrictEqual({
        executable: false,
        lamports: rent,
        programAddress: program.address,
        address: newAccount,
        data: new Uint8Array(Array.from({ length: 42 }, () => 0)),
        exists: true,
        space: 42n,
    });
});
