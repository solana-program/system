import { fetchEncodedAccount, generateKeyPairSigner } from '@solana/kit';
import { expect, it } from 'vitest';
import { createClient } from './_setup';

it('assigns a new owner to an account', async () => {
    // Given an existing account with enough SOL to be rent exempt with 0 data.
    const client = await createClient();
    const space = 0n;
    const [accountToAssign, newOwner, rent] = await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner(),
        client.rpc.getMinimumBalanceForRentExemption(space).send(),
    ]);
    await client.airdrop(accountToAssign.address, rent);

    // When we assign a new owner to this account.
    await client.system.instructions
        .assign({ account: accountToAssign, programAddress: newOwner.address })
        .sendTransaction();

    // Then we expect the account's owner to be the one we assigned.
    const fetchedAccount = await fetchEncodedAccount(client.rpc, accountToAssign.address);
    expect(fetchedAccount).toMatchObject({
        exists: true,
        programAddress: newOwner.address,
    });
});
