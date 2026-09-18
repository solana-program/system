import {
    AccountRole,
    getAddressDecoder,
    getAddressEncoder,
    getProgramDerivedAddress,
    generateKeyPairSigner,
    lamports,
    type AccountMeta,
    type AccountSignerMeta,
    type Address,
    type ReadonlyUint8Array,
} from '@solana/kit';
import { expect, expectTypeOf, it } from 'vitest';

import { getTransferSolInstruction, parseTransferSolInstruction, SYSTEM_PROGRAM_ADDRESS } from '../src';
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
    await client.system.instructions.transferSol({ source, destination, amount: 1_000_000_000 }).sendTransaction();

    // Then the source account now has exactly 2 SOL.
    const { value: sourceBalance } = await client.rpc.getBalance(source.address, { commitment: 'confirmed' }).send();
    expect(sourceBalance).toBe(lamports(2_000_000_000n));

    // And the destination account has exactly 1 SOL.
    const { value: destinationBalance } = await client.rpc.getBalance(destination, { commitment: 'confirmed' }).send();
    expect(destinationBalance).toBe(lamports(1_000_000_000n));
});

it('transfers SOL when the source is given as an explicit signer account meta', async () => {
    // Given a source account funded with 3 SOL and a fresh destination address.
    const client = await createTestClient();
    const [source, destination] = await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner().then(signer => signer.address),
    ]);
    await client.airdrop(source.address, lamports(3_000_000_000n));

    // When we transfer 1 SOL using the wide `AccountSignerMeta` input for the source — an explicit
    // `{ address, role, signer }` meta that escalates the source to a writable signer and attaches
    // the signer authorising the debit. The pre-2.5 renderer only accepted a bare TransactionSigner.
    const result = await client.system.instructions
        .transferSol({
            source: { address: source.address, role: AccountRole.WRITABLE_SIGNER, signer: source },
            destination,
            amount: 1_000_000_000,
        })
        .sendTransaction();

    // Then the escalated source genuinely signed the transaction and the balances settle exactly
    // as they would with a plain signer input.
    expect(result.context.transaction).toBeDefined();
    expect(Object.keys(result.context.transaction?.signatures ?? {})).toContain(source.address);
    const [{ value: sourceBalance }, { value: destinationBalance }] = await Promise.all([
        client.rpc.getBalance(source.address, { commitment: 'confirmed' }).send(),
        client.rpc.getBalance(destination, { commitment: 'confirmed' }).send(),
    ]);
    expect(sourceBalance).toBe(lamports(2_000_000_000n));
    expect(destinationBalance).toBe(lamports(1_000_000_000n));
});

it('transfers SOL when the destination is given as a signer acting as an address carrier', async () => {
    // Given a source account funded with 3 SOL and a destination that we hold as a signer.
    const client = await createTestClient();
    const [source, destination] = await Promise.all([generateKeyPairSigner(), generateKeyPairSigner()]);
    await client.airdrop(source.address, lamports(3_000_000_000n));

    // When we transfer 1 SOL passing the destination signer directly. The wide non-signer input
    // accepts any address carrier, so the signer is used purely for its address and is not
    // required to sign — the pre-2.5 renderer only accepted a plain Address here.
    const result = await client.system.instructions
        .transferSol({ source, destination, amount: 1_000_000_000 })
        .sendTransaction();

    // Then only the source signed — the destination was used purely as an address carrier and was
    // not promoted to a signer. Asserting this guards against a regression that starts collecting
    // the destination's signature, which LiteSVM would otherwise accept silently.
    const signers = Object.keys(result.context.transaction?.signatures ?? {});
    expect(signers).toContain(source.address);
    expect(signers).not.toContain(destination.address);

    // And the destination address received exactly 1 SOL.
    const { value: destinationBalance } = await client.rpc
        .getBalance(destination.address, { commitment: 'confirmed' })
        .send();
    expect(destinationBalance).toBe(lamports(1_000_000_000n));
});

it('transfers SOL when the destination is a lazily-decoded address carrier', async () => {
    // Given a funded source and a mock `PublicKey`-style object that stores its address as raw
    // bytes and only decodes them to a base58 address on demand via an `address` getter — mirroring
    // how a third-party framework might expose an address. The wide non-signer input accepts any
    // such `HasAddress` carrier, not just a pre-decoded `Address`.
    const client = await createTestClient();
    const [source, destinationSigner] = await Promise.all([generateKeyPairSigner(), generateKeyPairSigner()]);
    await client.airdrop(source.address, lamports(3_000_000_000n));

    const destinationBytes = getAddressEncoder().encode(destinationSigner.address);
    class MockPublicKey {
        readonly #bytes: ReadonlyUint8Array;
        constructor(bytes: ReadonlyUint8Array) {
            this.#bytes = bytes;
        }
        get address(): Address {
            return getAddressDecoder().decode(this.#bytes);
        }
    }
    const destination = new MockPublicKey(destinationBytes);

    // When we transfer 1 SOL passing the carrier directly as the destination.
    await client.system.instructions.transferSol({ source, destination, amount: 1_000_000_000 }).sendTransaction();

    // Then the address decoded from the carrier's bytes received exactly 1 SOL.
    const { value: destinationBalance } = await client.rpc
        .getBalance(destinationSigner.address, { commitment: 'confirmed' })
        .send();
    expect(destinationBalance).toBe(lamports(1_000_000_000n));
});

it('transfers SOL when the destination is given as a program-derived address', async () => {
    // Given a funded source and a PDA off the System program.
    const client = await createTestClient();
    const source = await generateKeyPairSigner();
    await client.airdrop(source.address, lamports(3_000_000_000n));
    const destination = await getProgramDerivedAddress({
        programAddress: SYSTEM_PROGRAM_ADDRESS,
        seeds: ['transfer-sol-destination'],
    });

    // When we transfer 1 SOL passing the `[address, bump]` PDA tuple directly as the destination.
    // The wide non-signer input accepts a `ProgramDerivedAddress` and uses its address.
    await client.system.instructions.transferSol({ source, destination, amount: 1_000_000_000 }).sendTransaction();

    // Then the PDA's address received exactly 1 SOL.
    const [destinationAddress] = destination;
    const { value: destinationBalance } = await client.rpc
        .getBalance(destinationAddress, { commitment: 'confirmed' })
        .send();
    expect(destinationBalance).toBe(lamports(1_000_000_000n));
});

it('infers the resolved account metas from the direct getter inputs', async () => {
    // The one-shot plugin path above resolves inputs at runtime but always widens to the
    // non-generic `TransferSolInput` defaults, so it never exercises the generic inference in
    // `getTransferSolInstruction`. This type-level test pins that inference: a `TransactionSigner`
    // source collapses to a signer meta with the signer attached, while a non-signing
    // program-derived address destination collapses to a plain account meta with no signer.
    const source = await generateKeyPairSigner();
    const destinationPda = await getProgramDerivedAddress({
        programAddress: SYSTEM_PROGRAM_ADDRESS,
        seeds: ['transfer-sol-destination'],
    });
    const [destinationAddress] = destinationPda;

    const instruction = getTransferSolInstruction({ source, destination: destinationPda, amount: 1_000_000_000 });

    // The signer source resolves to a signer meta carrying the attached signer, whereas the
    // non-signing PDA destination resolves to a plain account meta with no `signer` property.
    expectTypeOf(instruction.accounts[0]).toExtend<AccountSignerMeta<typeof source.address>>();
    expectTypeOf(instruction.accounts[0]).toHaveProperty('signer');
    expectTypeOf(instruction.accounts[1]).toExtend<AccountMeta<typeof destinationAddress>>();
    expectTypeOf(instruction.accounts[1]).not.toHaveProperty('signer');

    // The keypair signer and PDA above are both unbranded (`Address<string>`), so the assertions
    // above only pin the meta *shape*. Passing a literal-branded address instead proves the brand
    // itself flows through `InstructionAccountInputAddress<T>` into the resolved account meta.
    const literalInstruction = getTransferSolInstruction({
        source,
        destination: SYSTEM_PROGRAM_ADDRESS,
        amount: 1_000_000_000,
    });
    expectTypeOf(literalInstruction.accounts[1].address).toEqualTypeOf<Address<'11111111111111111111111111111111'>>();
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
