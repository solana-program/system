import { AccountRole, generateKeyPairSigner, lamports } from '@solana/kit';
import { expect, it } from 'vitest';
import { getTransferInstruction, parseTransferInstruction } from '../src';
import { createTestClient } from './_setup';

it('transfers SOL from one account to another', async () => {
    // Given a source account with 3 SOL and a destination account with no SOL.
    const client = await createTestClient();
    const [source, destination] = await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner().then(signer => signer.address),
    ]);
    await client.airdrop(source.address, lamports(3_000_000_000n));

    // When the source account transfers 1 SOL to the destination account.
    await client.system.instructions.transfer({ source, destination, lamports: 1_000_000_000 }).sendTransaction();

    // Then the source account now has exactly 2 SOL.
    const { value: sourceBalance } = await client.rpc.getBalance(source.address, { commitment: 'confirmed' }).send();
    expect(sourceBalance).toBe(lamports(2_000_000_000n));

    // And the destination account has exactly 1 SOL.
    const { value: destinationBalance } = await client.rpc.getBalance(destination, { commitment: 'confirmed' }).send();
    expect(destinationBalance).toBe(lamports(1_000_000_000n));
});

it('parses the accounts and the data of an existing transfer SOL instruction', async () => {
    // Given a transfer SOL instruction with the following accounts and data.
    const source = await generateKeyPairSigner();
    const destination = (await generateKeyPairSigner()).address;
    const transfer = getTransferInstruction({
        source,
        destination,
        lamports: 1_000_000_000,
    });

    // When we parse this instruction.
    const parsedTransfer = parseTransferInstruction(transfer);

    // Then we expect the following accounts and data.
    expect(parsedTransfer.accounts.source.address).toBe(source.address);
    expect(parsedTransfer.accounts.source.role).toBe(AccountRole.WRITABLE_SIGNER);
    expect(parsedTransfer.accounts.source.signer).toBe(source);
    expect(parsedTransfer.accounts.destination.address).toBe(destination);
    expect(parsedTransfer.accounts.destination.role).toBe(AccountRole.WRITABLE);
    expect(parsedTransfer.data.lamports).toBe(1_000_000_000n);
    expect(parsedTransfer.programAddress).toBe('11111111111111111111111111111111');
});
