import { AccountRole, generateKeyPairSigner, lamports } from '@solana/kit';
import { expect, it } from 'vitest';
import { getTransferSolInstruction, parseTransferSolInstruction } from '../src';
import { createClient, generateKeyPairSignerWithSol, getBalance } from './_setup';

it('transfers SOL from one account to another', async () => {
    // Given a source account with 3 SOL and a destination account with no SOL.
    const client = await createClient();
    const [source, destination] = await Promise.all([
        generateKeyPairSignerWithSol(client, 3_000_000_000n),
        generateKeyPairSigner().then(signer => signer.address),
    ]);

    // When the source account transfers 1 SOL to the destination account.
    await client.system.instructions.transferSol({ source, destination, amount: 1_000_000_000 }).sendTransaction();

    // Then the source account now has exactly 2 SOL.
    expect(await getBalance(client, source.address)).toBe(lamports(2_000_000_000n));

    // And the destination account has exactly 1 SOL.
    expect(await getBalance(client, destination)).toBe(lamports(1_000_000_000n));
});

it('parses the accounts and the data of an existing transfer SOL instruction', async () => {
    // Given a transfer SOL instruction with the following accounts and data.
    const source = await generateKeyPairSigner();
    const destination = (await generateKeyPairSigner()).address;
    const transferSol = getTransferSolInstruction({
        source,
        destination,
        amount: 1_000_000_000,
    });

    // When we parse this instruction.
    const parsedTransferSol = parseTransferSolInstruction(transferSol);

    // Then we expect the following accounts and data.
    expect(parsedTransferSol.accounts.source.address).toBe(source.address);
    expect(parsedTransferSol.accounts.source.role).toBe(AccountRole.WRITABLE_SIGNER);
    expect(parsedTransferSol.accounts.source.signer).toBe(source);
    expect(parsedTransferSol.accounts.destination.address).toBe(destination);
    expect(parsedTransferSol.accounts.destination.role).toBe(AccountRole.WRITABLE);
    expect(parsedTransferSol.data.amount).toBe(1_000_000_000n);
    expect(parsedTransferSol.programAddress).toBe('11111111111111111111111111111111');
});
