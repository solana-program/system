import {
    address,
    generateKeyPairSigner,
    getProgramDerivedAddress,
    lamports,
    type Address,
    type HasAddress,
} from '@solana/kit';
import { expect, it, vi } from 'vitest';

import { assertValidTransferSolDestination, InvalidTransferSolDestinationError, SYSTEM_PROGRAM_ADDRESS } from '../src';
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
    const promise = assertValidTransferSolDestination(client.rpc, destination);
    await expect(promise).rejects.toBeInstanceOf(InvalidTransferSolDestinationError);
    await expect(promise).rejects.toMatchObject({
        message: expect.stringContaining(`owned by program ${TOKEN_PROGRAM_ADDRESS}`),
        destination,
        reason: 'unexpected-owner',
        owner: TOKEN_PROGRAM_ADDRESS,
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
    ).rejects.toMatchObject({ reason: 'unexpected-owner', owner: SYSTEM_PROGRAM_ADDRESS });
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
        destination: destination.address,
        reason: 'unexpected-owner',
    });
});

it('accepts a ProgramDerivedAddress destination', async () => {
    // Given a funded off-curve System-Program-owned account held as a `[address, bump]` tuple.
    const client = await createTestClient();
    const destination = await getProgramDerivedAddress({
        programAddress: SYSTEM_PROGRAM_ADDRESS,
        seeds: ['guarded-transfer'],
    });
    await client.airdrop(destination[0], lamports(1_000_000_000n));

    // Then it is valid by default and rejected, reporting the PDA's address, when off-curve is disallowed.
    await expect(assertValidTransferSolDestination(client.rpc, destination)).resolves.toBeUndefined();
    await expect(
        assertValidTransferSolDestination(client.rpc, destination, { allowOffCurve: false }),
    ).rejects.toMatchObject({ destination: destination[0], reason: 'off-curve' });
});

it('rejects an unfunded recipient by default', async () => {
    // Given an on-curve address with no account on-chain.
    const client = await createTestClient();
    const destination = (await generateKeyPairSigner()).address;

    // Then it is rejected as unfunded.
    await expect(assertValidTransferSolDestination(client.rpc, destination)).rejects.toMatchObject({
        reason: 'unfunded-recipient',
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
    ).rejects.toMatchObject({ reason: 'off-curve' });
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
    ).rejects.toMatchObject({ reason: 'off-curve' });
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
