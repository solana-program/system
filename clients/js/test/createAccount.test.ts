import { fetchEncodedAccount, generateKeyPairSigner } from '@solana/kit';
import { expect, it } from 'vitest';
import { SYSTEM_PROGRAM_ADDRESS } from '../src';
import { createClient } from './_setup';

it('creates a new empty account', async () => {
    // Given a new keypair and the computed rent for 42 bytes of space.
    const client = await createClient();
    const space = 42n;
    const [newAccount, lamports] = await Promise.all([
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);

    // When we create a new 42-byte account with this keypair as the address.
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
