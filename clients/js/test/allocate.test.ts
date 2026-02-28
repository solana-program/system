import { assertAccountExists, fetchEncodedAccount, generateKeyPairSigner } from '@solana/kit';
import { expect, it } from 'vitest';
import { createClient } from './_setup';

it('allocates space for an account', async () => {
    // Given an existing account with some SOL and 0 data.
    const client = await createClient();
    const newSpace = 100n;
    const [accountToAllocate, newRent] = await Promise.all([
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(newSpace).send(),
    ]);
    await client.airdrop(accountToAllocate.address, newRent);

    // And given we verify the account has 0 data length before allocation.
    let fetchedAccount = await fetchEncodedAccount(client.rpc, accountToAllocate.address);
    expect(fetchedAccount.exists).toBe(true);
    assertAccountExists(fetchedAccount);
    expect(fetchedAccount.data.length).toBe(0);

    // When we allocate 100 bytes of space for this account.
    await client.system.instructions.allocate({ newAccount: accountToAllocate, space: newSpace }).sendTransaction();

    // Then the account's data length should be exactly 100 bytes.
    fetchedAccount = await fetchEncodedAccount(client.rpc, accountToAllocate.address);
    expect(fetchedAccount.exists).toBe(true);
    assertAccountExists(fetchedAccount);
    expect(fetchedAccount.data.length).toBe(100);
});
