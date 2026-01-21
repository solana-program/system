import {
    appendTransactionMessageInstruction,
    fetchEncodedAccount,
    generateKeyPairSigner,
    pipe,
    airdropFactory,
    lamports,
} from '@solana/kit';
import { it, expect } from 'vitest';
import { getAllocateInstruction } from '../src';
import {
    createDefaultSolanaClient,
    createDefaultTransaction,
    generateKeyPairSignerWithSol,
    signAndSendTransaction,
} from './_setup';

it('allocates space for an account', async () => {
    // 1. Setup client and payer.
    const client = createDefaultSolanaClient();
    const [payer, accountToAllocate] = await Promise.all([
        generateKeyPairSignerWithSol(client),
        generateKeyPairSigner(),
    ]);

    // 2. Airdrop lamports to the account so it exists (system owned, 0 data).
    await airdropFactory(client)({
        recipientAddress: accountToAllocate.address,
        lamports: lamports(await client.rpc.getMinimumBalanceForRentExemption(100n).send()),
        commitment: 'confirmed',
    });

    // Verify initial state
    let fetchedAccount = await fetchEncodedAccount(client.rpc, accountToAllocate.address);
    expect(fetchedAccount.exists).toBe(true);
    if (fetchedAccount.exists) {
        expect(fetchedAccount.data.length).toBe(0);
    }

    // 3. Use getAllocateInstruction to allocate 100 bytes.
    const newSpace = 100n;
    const allocate = getAllocateInstruction({
        newAccount: accountToAllocate,
        space: newSpace,
    });

    // 4. Send transaction
    await pipe(
        await createDefaultTransaction(client, payer),
        tx => appendTransactionMessageInstruction(allocate, tx),
        tx => signAndSendTransaction(client, tx),
    );

    // 5. Verify the account's data length is exactly 100 bytes.
    fetchedAccount = await fetchEncodedAccount(client.rpc, accountToAllocate.address);
    expect(fetchedAccount.exists).toBe(true);
    if (fetchedAccount.exists) {
        expect(fetchedAccount.data.length).toBe(100);
    }
});
