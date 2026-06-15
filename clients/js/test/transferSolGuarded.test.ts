import { address, generateKeyPairSigner, getProgramDerivedAddress, lamports, type Address } from '@solana/kit';
import { expect, it } from 'vitest';

import {
    assertValidTransferSolDestination,
    getTransferSolGuardedInstruction,
    getTransferSolInstruction,
    InvalidTransferSolDestinationError,
    SYSTEM_PROGRAM_ADDRESS,
} from '../src';
import { createTestClient } from './_setup';

const TOKEN_PROGRAM_ADDRESS = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

type TestClient = Awaited<ReturnType<typeof createTestClient>>;

// Creates an on-chain account owned by a program other than the System Program, like an SPL token mint.
const createForeignOwnedAddress = async (client: TestClient): Promise<Address> => {
    const account = await generateKeyPairSigner();
    await client.airdrop(account.address, lamports(1_000_000_000n));
    await client.system.instructions.assign({ account, programAddress: TOKEN_PROGRAM_ADDRESS }).sendTransaction();
    return account.address;
};

const deriveOffCurveAddress = async (): Promise<Address> => {
    const [pda] = await getProgramDerivedAddress({
        programAddress: SYSTEM_PROGRAM_ADDRESS,
        seeds: ['guarded-transfer'],
    });
    return pda;
};

it('accepts an existing System-Program-owned destination', async () => {
    const client = await createTestClient();
    const destination = (await generateKeyPairSigner()).address;
    await client.airdrop(destination, lamports(1_000_000_000n));
    await expect(assertValidTransferSolDestination(client.rpc, destination)).resolves.toBeUndefined();
});

it('rejects an existing destination owned by another program', async () => {
    const client = await createTestClient();
    const destination = await createForeignOwnedAddress(client);

    await expect(assertValidTransferSolDestination(client.rpc, destination)).rejects.toThrow(
        InvalidTransferSolDestinationError,
    );

    const error = await assertValidTransferSolDestination(client.rpc, destination).catch(e => e);
    expect(error).toBeInstanceOf(InvalidTransferSolDestinationError);
    expect(error.reason).toBe('unexpected-owner');
    expect(error.owner).toBe(TOKEN_PROGRAM_ADDRESS);
    expect(error.destination).toBe(destination);
});

it('accepts an existing destination owned by the program given in programOwner', async () => {
    const client = await createTestClient();
    const destination = await createForeignOwnedAddress(client);
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { programOwner: TOKEN_PROGRAM_ADDRESS }),
    ).resolves.toBeUndefined();
});

it('rejects a System-Program-owned destination when programOwner expects another program', async () => {
    const client = await createTestClient();
    const destination = (await generateKeyPairSigner()).address;
    await client.airdrop(destination, lamports(1_000_000_000n));

    const error = await assertValidTransferSolDestination(client.rpc, destination, {
        programOwner: TOKEN_PROGRAM_ADDRESS,
    }).catch(e => e);
    expect(error).toBeInstanceOf(InvalidTransferSolDestinationError);
    expect(error.reason).toBe('unexpected-owner');
    expect(error.owner).toBe(SYSTEM_PROGRAM_ADDRESS);
});

it('rejects an unfunded recipient by default', async () => {
    const client = await createTestClient();
    const destination = (await generateKeyPairSigner()).address;

    await expect(assertValidTransferSolDestination(client.rpc, destination)).rejects.toThrow(
        InvalidTransferSolDestinationError,
    );

    const error = await assertValidTransferSolDestination(client.rpc, destination).catch(e => e);
    expect(error.reason).toBe('unfunded-recipient');
});

it('accepts an unfunded on-curve recipient when allowUnfundedRecipient is set', async () => {
    const client = await createTestClient();
    const destination = (await generateKeyPairSigner()).address;
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { allowUnfundedRecipient: true }),
    ).resolves.toBeUndefined();
});

it('rejects an unfunded off-curve recipient even when allowUnfundedRecipient is set', async () => {
    const client = await createTestClient();
    const destination = await deriveOffCurveAddress();

    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { allowUnfundedRecipient: true }),
    ).rejects.toThrow(InvalidTransferSolDestinationError);

    const error = await assertValidTransferSolDestination(client.rpc, destination, {
        allowUnfundedRecipient: true,
    }).catch(e => e);
    expect(error.reason).toBe('off-curve');
});

it('accepts an unfunded off-curve recipient when both flags are set', async () => {
    const client = await createTestClient();
    const destination = await deriveOffCurveAddress();
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, {
            allowOffCurve: true,
            allowUnfundedRecipient: true,
        }),
    ).resolves.toBeUndefined();
});

it('rejects an existing off-curve System-Program-owned account unless allowOffCurve is set', async () => {
    const client = await createTestClient();
    const destination = await deriveOffCurveAddress();
    await client.airdrop(destination, lamports(1_000_000_000n));

    const error = await assertValidTransferSolDestination(client.rpc, destination).catch(e => e);
    expect(error).toBeInstanceOf(InvalidTransferSolDestinationError);
    expect(error.reason).toBe('off-curve');

    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { allowOffCurve: true }),
    ).resolves.toBeUndefined();
});

it('builds an instruction identical to getTransferSolInstruction for a safe destination', async () => {
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    const destination = (await generateKeyPairSigner()).address;
    const input = { source, destination, amount: 1_000_000_000 };

    const guarded = await getTransferSolGuardedInstruction(client.rpc, input, { allowUnfundedRecipient: true });

    expect(guarded).toStrictEqual(getTransferSolInstruction(input));
});

it('refuses to build an instruction for an unsafe destination', async () => {
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    const destination = await createForeignOwnedAddress(client);

    await expect(getTransferSolGuardedInstruction(client.rpc, { source, destination, amount: 1n })).rejects.toThrow(
        InvalidTransferSolDestinationError,
    );
});

it('transfers SOL to a safe destination via the client plugin method', async () => {
    const client = await createTestClient();
    const [source, destination] = await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner().then(signer => signer.address),
    ]);
    await client.airdrop(source.address, lamports(3_000_000_000n));

    await client.system.instructions
        .transferSolGuarded({ source, destination, amount: 1_000_000_000 }, { allowUnfundedRecipient: true })
        .sendTransaction();

    const { value: sourceBalance } = await client.rpc.getBalance(source.address, { commitment: 'confirmed' }).send();
    expect(sourceBalance).toBe(lamports(2_000_000_000n));
    const { value: destinationBalance } = await client.rpc.getBalance(destination, { commitment: 'confirmed' }).send();
    expect(destinationBalance).toBe(lamports(1_000_000_000n));
});

it('rejects an unsafe destination via the client plugin method', async () => {
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    await client.airdrop(source.address, lamports(1_000_000_000n));
    const destination = await createForeignOwnedAddress(client);

    await expect(
        client.system.instructions.transferSolGuarded({ source, destination, amount: 1n }).sendTransaction(),
    ).rejects.toThrow(InvalidTransferSolDestinationError);
});
