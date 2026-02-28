import { generateKeyPairSigner } from '@solana/kit';
import { expect, it } from 'vitest';
import { createClient, getCreateNonceInstructionPlan } from './_setup';

it('advances the nonce account', async () => {
    // Given an existing nonce account.
    const [client, nonce, authority] = await Promise.all([
        createClient(),
        generateKeyPairSigner(),
        generateKeyPairSigner(),
    ]);
    await client.sendTransaction(await getCreateNonceInstructionPlan(client, nonce, authority));
    const originalNonceAccount = await client.system.accounts.nonce.fetch(nonce.address);

    // When the authority advances the nonce account.
    await client.system.instructions
        .advanceNonceAccount({ nonceAccount: nonce.address, nonceAuthority: authority })
        .sendTransaction();

    // Then we expect the blockhash to have been updated.
    const updatedNonceAccount = await client.system.accounts.nonce.fetch(nonce.address);
    expect(originalNonceAccount.data.blockhash).not.toBe(updatedNonceAccount.data.blockhash);
});
