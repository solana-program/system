import { AccountRole, address, createNoopSigner } from '@solana/kit';
import {
    getTransferSolInstruction,
    parseSystemInstruction,
    SYSTEM_PROGRAM_ADDRESS,
    SystemInstruction,
    TRANSFER_SOL_DISCRIMINATOR,
} from '../src';
import { it, expect } from 'vitest';

it('parses a transfer SOL instruction', () => {
    const source = createNoopSigner(address('9aE3e5LQT2qKDpnoYytMVNFq7ZtbBFCpTyvKUJUx5MkX'));
    const destination = address('HgnzqSaAXxcw3acG33VRMMjsuDSCVr6oT56iyY9BWmzH');

    // Given an instruction that transfers SOL from one account to another.
    const transferSolInstruction = getTransferSolInstruction({
        source,
        destination,
        amount: 1_000_000_000,
    });

    // When we parse this instruction.
    const parsedInstruction = parseSystemInstruction(transferSolInstruction);

    // Then we expect it to be a transfer SOL instruction with the correct accounts and data.
    expect(parsedInstruction.instructionType).toStrictEqual(SystemInstruction.TransferSol);
    expect(parsedInstruction.programAddress).toBe(SYSTEM_PROGRAM_ADDRESS);
    expect(parsedInstruction.accounts).toStrictEqual({
        source: {
            address: source.address,
            role: AccountRole.WRITABLE_SIGNER,
            signer: source,
        },
        destination: {
            address: destination,
            role: AccountRole.WRITABLE,
        },
    });
    expect(parsedInstruction.data).toStrictEqual({
        amount: 1_000_000_000n,
        discriminator: TRANSFER_SOL_DISCRIMINATOR,
    });
});
