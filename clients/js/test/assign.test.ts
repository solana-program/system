import { appendTransactionMessageInstruction, fetchEncodedAccount, generateKeyPairSigner, pipe } from '@solana/kit';
import { it, expect } from 'vitest';
import { SYSTEM_PROGRAM_ADDRESS, getAssignInstruction, getTransferSolInstruction } from '../src';
import {
    createDefaultSolanaClient,
    createDefaultTransaction,
    generateKeyPairSignerWithSol,
    signAndSendTransaction,
} from './_setup';

it('assigns a new owner to an account', async () => {
    // 1. Setup client and payer.
    const client = createDefaultSolanaClient();
    const [payer, accountToAssign, newOwner] = await Promise.all([
        generateKeyPairSignerWithSol(client),
        generateKeyPairSigner(),
        generateKeyPairSigner(),
    ]);

    // 2. Create the account first (so it exists on-chain).
    // The account needs to exist to be assigned.
    const space = 0n;
    const lamports = await client.rpc.getMinimumBalanceForRentExemption(space).send();

    const transfer = getTransferSolInstruction({
        source: payer,
        destination: accountToAssign.address,
        amount: lamports,
    });

    // 3. Use getAssignInstruction to change the owner of accountToAssign to newOwner.
    const assign = getAssignInstruction({
        account: accountToAssign,
        programAddress: newOwner.address,
    });

    // 4. Sign and send the transaction.
    await pipe(
        await createDefaultTransaction(client, payer),
        tx => appendTransactionMessageInstruction(transfer, tx),
        tx => appendTransactionMessageInstruction(assign, tx),
        tx => signAndSendTransaction(client, tx),
    );

    // 5. Fetch the account data and verify the owner.
    const fetchedAccount = await fetchEncodedAccount(client.rpc, accountToAssign.address);
    // In solana/kit, 'programAddress' is the field for the account owner.
    expect(fetchedAccount).toMatchObject({
        exists: true,
        programAddress: newOwner.address,
    });
});
