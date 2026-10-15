import {
    address,
    generateKeyPairSigner,
    getProgramDerivedAddress,
    lamports,
    type Address,
    type HasAddress,
} from '@solana/kit';
import { expect, it, vi } from 'vitest';

import {
    assertValidTransferSolDestination,
    getTransferSolGuardedInstruction,
    getTransferSolInstruction,
    SYSTEM_PROGRAM_ADDRESS,
} from '../src';
import { createTestClient } from './_setup';

const TOKEN_PROGRAM_ADDRESS = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

type TestClient = Awaited<ReturnType<typeof createTestClient>>;

class AddressWrapper implements HasAddress {
    constructor(readonly address: Address) {}
}

// Creates a funded account assigned to the Token program, standing in for an SPL token mint.
const createForeignOwnedAddress = async (client: TestClient): Promise<Address> => {
    const account = await generateKeyPairSigner();
    await client.airdrop(account.address, lamports(1_000_000_000n));
    await client.system.instructions.assign({ account, programAddress: TOKEN_PROGRAM_ADDRESS }).sendTransaction();
    return account.address;
};

const createFundedAddress = async (client: TestClient): Promise<Address> => {
    const destination = (await generateKeyPairSigner()).address;
    await client.airdrop(destination, lamports(1_000_000_000n));
    return destination;
};

const deriveOffCurveAddress = async (): Promise<Address> => {
    const [pda] = await getProgramDerivedAddress({
        programAddress: SYSTEM_PROGRAM_ADDRESS,
        seeds: ['guarded-transfer'],
    });
    return pda;
};

it('accepts an existing System-Program-owned destination', async () => {
    // Given a funded System-Program-owned destination.
    const client = await createTestClient();
    const destination = await createFundedAddress(client);

    // Then it is a valid destination.
    await expect(assertValidTransferSolDestination(client.rpc, destination)).resolves.toBeUndefined();
});

it('rejects an existing destination owned by another program', async () => {
    // Given a destination owned by the Token program.
    const client = await createTestClient();
    const destination = await createForeignOwnedAddress(client);

    // Then it is rejected as owned by an unexpected program.
    await expect(assertValidTransferSolDestination(client.rpc, destination)).rejects.toMatchObject({
        message: expect.stringContaining(`owned by program ${TOKEN_PROGRAM_ADDRESS}`),
        cause: { destination, reason: 'unexpected-owner', owner: TOKEN_PROGRAM_ADDRESS },
    });
});

it('accepts an existing destination owned by the program given in programOwner', async () => {
    // Given a destination owned by the Token program.
    const client = await createTestClient();
    const destination = await createForeignOwnedAddress(client);

    // Then it is valid when the Token program is the expected owner.
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { programOwner: TOKEN_PROGRAM_ADDRESS }),
    ).resolves.toBeUndefined();
});

it('rejects a System-Program-owned destination when programOwner expects another program', async () => {
    // Given a funded System-Program-owned destination.
    const client = await createTestClient();
    const destination = await createFundedAddress(client);

    // Then it is rejected when the Token program is the expected owner.
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { programOwner: TOKEN_PROGRAM_ADDRESS }),
    ).rejects.toMatchObject({ cause: { reason: 'unexpected-owner', owner: SYSTEM_PROGRAM_ADDRESS } });
});

it('accepts a HasAddress destination', async () => {
    // Given a funded destination held as a signer.
    const client = await createTestClient();
    const destination = await generateKeyPairSigner();
    await client.airdrop(destination.address, lamports(1_000_000_000n));

    // Then it is valid as a signer and as an `AddressWrapper`.
    await expect(assertValidTransferSolDestination(client.rpc, destination)).resolves.toBeUndefined();
    await expect(
        assertValidTransferSolDestination(client.rpc, new AddressWrapper(destination.address)),
    ).resolves.toBeUndefined();
});

it('rejects a HasAddress destination owned by another program', async () => {
    // Given a Token-program-owned destination held in an `AddressWrapper`.
    const client = await createTestClient();
    const destination = new AddressWrapper(await createForeignOwnedAddress(client));

    // Then it is rejected, reporting the wrapped address.
    await expect(assertValidTransferSolDestination(client.rpc, destination)).rejects.toMatchObject({
        cause: { destination: destination.address, reason: 'unexpected-owner' },
    });
});

it('rejects an unfunded recipient by default', async () => {
    // Given an on-curve address with no account on-chain.
    const client = await createTestClient();
    const destination = (await generateKeyPairSigner()).address;

    // Then it is rejected as unfunded.
    await expect(assertValidTransferSolDestination(client.rpc, destination)).rejects.toMatchObject({
        cause: { reason: 'unfunded-recipient' },
    });
});

it('accepts an unfunded on-curve recipient when allowUnfundedRecipient is set', async () => {
    // Given an on-curve address with no account on-chain.
    const client = await createTestClient();
    const destination = (await generateKeyPairSigner()).address;

    // Then it is valid when unfunded recipients are allowed.
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { allowUnfundedRecipient: true }),
    ).resolves.toBeUndefined();
});

it('accepts an unfunded off-curve recipient when allowUnfundedRecipient is set', async () => {
    // Given an off-curve address with no account on-chain.
    const client = await createTestClient();
    const destination = await deriveOffCurveAddress();

    // Then it is valid when unfunded recipients are allowed.
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { allowUnfundedRecipient: true }),
    ).resolves.toBeUndefined();
});

it('rejects an unfunded off-curve recipient as off-curve when allowOffCurve is false', async () => {
    // Given an off-curve address with no account on-chain.
    const client = await createTestClient();
    const destination = await deriveOffCurveAddress();

    // Then it is rejected as off-curve even when unfunded recipients are allowed.
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, {
            allowOffCurve: false,
            allowUnfundedRecipient: true,
        }),
    ).rejects.toMatchObject({ cause: { reason: 'off-curve' } });
});

it('accepts an existing off-curve System-Program-owned account unless allowOffCurve is false', async () => {
    // Given a funded off-curve System-Program-owned account.
    const client = await createTestClient();
    const destination = await deriveOffCurveAddress();
    await client.airdrop(destination, lamports(1_000_000_000n));

    // Then it is valid by default and rejected when off-curve recipients are disallowed.
    await expect(assertValidTransferSolDestination(client.rpc, destination)).resolves.toBeUndefined();
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { allowOffCurve: false }),
    ).rejects.toMatchObject({ cause: { reason: 'off-curve' } });
});

it('builds an instruction identical to getTransferSolInstruction for a safe destination', async () => {
    // Given an unfunded on-curve destination.
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    const destination = (await generateKeyPairSigner()).address;
    const input = { source, destination, amount: 1_000_000_000 };

    // When we build a guarded transfer allowing unfunded recipients.
    const guarded = await getTransferSolGuardedInstruction(client.rpc, input, { allowUnfundedRecipient: true });

    // Then it matches the unguarded instruction.
    expect(guarded).toStrictEqual(getTransferSolInstruction(input));
});

it('builds an instruction for a HasAddress destination', async () => {
    // Given an unfunded on-curve destination held in an `AddressWrapper`.
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    const destination = new AddressWrapper((await generateKeyPairSigner()).address);
    const input = { source, destination, amount: 1_000_000_000 };

    // When we build a guarded transfer allowing unfunded recipients.
    const guarded = await getTransferSolGuardedInstruction(client.rpc, input, { allowUnfundedRecipient: true });

    // Then it matches the unguarded instruction.
    expect(guarded).toStrictEqual(getTransferSolInstruction(input));
});

it('refuses to build an instruction for an unsafe destination', async () => {
    // Given a destination owned by the Token program.
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    const destination = await createForeignOwnedAddress(client);

    // Then building a guarded transfer throws.
    await expect(getTransferSolGuardedInstruction(client.rpc, { source, destination, amount: 1n })).rejects.toThrow(
        `owned by program ${TOKEN_PROGRAM_ADDRESS}`,
    );
});

it('refuses to build an instruction for an unsafe HasAddress destination', async () => {
    // Given a Token-program-owned destination held in an `AddressWrapper`.
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    const destination = new AddressWrapper(await createForeignOwnedAddress(client));

    // Then building a guarded transfer throws for the wrapped address.
    await expect(getTransferSolGuardedInstruction(client.rpc, { source, destination, amount: 1n })).rejects.toThrow(
        `Refusing to transfer SOL to ${destination.address}`,
    );
});

it('refuses to build an instruction for an off-curve program-derived address destination', async () => {
    // Given an unfunded off-curve destination as a program-derived address tuple.
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    const destination = await getProgramDerivedAddress({
        programAddress: SYSTEM_PROGRAM_ADDRESS,
        seeds: ['guarded-transfer'],
    });

    // Then building a guarded transfer that disallows off-curve recipients throws for the derived address.
    await expect(
        getTransferSolGuardedInstruction(
            client.rpc,
            { source, destination, amount: 1n },
            { allowOffCurve: false, allowUnfundedRecipient: true },
        ),
    ).rejects.toThrow(`Refusing to transfer SOL to ${destination[0]}: it is an off-curve`);
});

it('transfers SOL to a safe destination via the client plugin method', async () => {
    // Given a source account with 3 SOL and an unfunded on-curve destination.
    const client = await createTestClient();
    const [source, destination] = await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner().then(signer => signer.address),
    ]);
    await client.airdrop(source.address, lamports(3_000_000_000n));

    // When the source transfers 1 SOL through the guarded plugin method.
    await client.system.instructions
        .transferSolGuarded({ source, destination, amount: 1_000_000_000 }, { allowUnfundedRecipient: true })
        .sendTransaction();

    // Then the source has exactly 2 SOL.
    const { value: sourceBalance } = await client.rpc.getBalance(source.address, { commitment: 'confirmed' }).send();
    expect(sourceBalance).toBe(lamports(2_000_000_000n));
    // And the destination has exactly 1 SOL.
    const { value: destinationBalance } = await client.rpc.getBalance(destination, { commitment: 'confirmed' }).send();
    expect(destinationBalance).toBe(lamports(1_000_000_000n));
});

it('rejects an unsafe destination via the client plugin method', async () => {
    // Given a funded source and a destination owned by the Token program.
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    await client.airdrop(source.address, lamports(1_000_000_000n));
    const destination = await createForeignOwnedAddress(client);

    // Then transferring SOL through the guarded plugin method throws.
    await expect(
        client.system.instructions.transferSolGuarded({ source, destination, amount: 1n }).sendTransaction(),
    ).rejects.toThrow(`owned by program ${TOKEN_PROGRAM_ADDRESS}`);
});

it('does not forward guard options to getAccountInfo', async () => {
    // Given a funded destination and an RPC that records getAccountInfo calls.
    const client = await createTestClient();
    const destination = await createFundedAddress(client);
    const getAccountInfo = vi.fn(client.rpc.getAccountInfo);
    const rpc = { getAccountInfo } as unknown as typeof client.rpc;

    // When we validate it with guard options and a commitment.
    await assertValidTransferSolDestination(rpc, destination, {
        allowOffCurve: true,
        allowUnfundedRecipient: true,
        commitment: 'confirmed',
        programOwner: SYSTEM_PROGRAM_ADDRESS,
    });

    // Then only the fetch options reach the RPC.
    expect(getAccountInfo).toHaveBeenCalledWith(destination, { commitment: 'confirmed', encoding: 'base64' });
});
