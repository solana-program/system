import { fetchEncodedAccount, isOffCurveAddress, type Address, type FetchAccountConfig } from '@solana/kit';

import {
    getTransferSolInstruction,
    SYSTEM_PROGRAM_ADDRESS,
    type TransferSolInput,
    type TransferSolInstruction,
} from './generated';

/** Distinguishes why a destination was rejected by {@link assertValidTransferSolDestination}. */
export type InvalidTransferSolDestinationReason = 'non-system-owner' | 'unfunded-recipient' | 'off-curve-nonexistent';

/** Options for validating a SOL-transfer destination. Extends {@link FetchAccountConfig}. */
export type TransferSolGuardConfig = FetchAccountConfig & {
    /**
     * Allow a destination that has no account on-chain yet, funding it as part of the transfer.
     * Defaults to `false`, since an unfunded recipient is often a mistyped address.
     */
    allowUnfundedRecipient?: boolean;
    /**
     * Allow an unfunded destination that is off-curve (a program-derived address). Only relevant
     * together with `allowUnfundedRecipient`, and has no effect on accounts that already exist.
     * Defaults to `false`.
     */
    allowOffCurve?: boolean;
    /**
     * The program expected to own an existing destination account. A destination owned by any other
     * program is rejected. Defaults to the System Program ({@link SYSTEM_PROGRAM_ADDRESS}).
     */
    programOwner?: Address;
};

/** Thrown when a SOL-transfer destination is not a valid System-Program-owned recipient. */
export class InvalidTransferSolDestinationError extends Error {
    readonly destination: Address;
    /** The program that owns the destination account, set only when `reason` is `'non-system-owner'`. */
    readonly owner?: Address;
    readonly reason: InvalidTransferSolDestinationReason;

    constructor(
        message: string,
        details: { destination: Address; owner?: Address; reason: InvalidTransferSolDestinationReason },
    ) {
        super(message);
        this.name = 'InvalidTransferSolDestinationError';
        this.destination = details.destination;
        this.owner = details.owner;
        this.reason = details.reason;
    }
}

/**
 * Asserts that `destination` can safely receive a SOL transfer, throwing
 * {@link InvalidTransferSolDestinationError} otherwise.
 *
 * By default a destination is valid only when it is an account already owned by the System Program;
 * pass `programOwner` to expect a different owner. An existing account owned by any other program —
 * most commonly an SPL token mint — is rejected, since SOL sent to it is typically unrecoverable. A
 * destination with no account on-chain is rejected
 * unless `allowUnfundedRecipient` is set, and an unfunded off-curve address additionally requires
 * `allowOffCurve`.
 *
 * Reads the destination's on-chain owner, so an RPC supporting `getAccountInfo` is required.
 */
export async function assertValidTransferSolDestination(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    destination: Address,
    config?: TransferSolGuardConfig,
): Promise<void> {
    const programOwner = config?.programOwner ?? SYSTEM_PROGRAM_ADDRESS;
    const account = await fetchEncodedAccount(rpc, destination, config);

    if (account.exists) {
        if (account.programAddress !== programOwner) {
            throw new InvalidTransferSolDestinationError(
                `Refusing to transfer SOL to ${destination}: it is owned by program ${account.programAddress}, not the expected program (${programOwner}). It is likely an SPL token mint or another program account, and SOL sent to it would be unrecoverable. Verify the recipient is a wallet address.`,
                { destination, owner: account.programAddress, reason: 'non-system-owner' },
            );
        }
        return;
    }

    if (!config?.allowUnfundedRecipient) {
        throw new InvalidTransferSolDestinationError(
            `Refusing to transfer SOL to ${destination}: it has no account on-chain yet, which often means the address is mistyped. If you intend to fund a new account, pass { allowUnfundedRecipient: true }.`,
            { destination, reason: 'unfunded-recipient' },
        );
    }

    if (isOffCurveAddress(destination) && !config?.allowOffCurve) {
        throw new InvalidTransferSolDestinationError(
            `Refusing to transfer SOL to ${destination}: it is an off-curve (program-derived) address with no account on-chain, so no keypair can control funds sent to it. If you intend to fund a PDA, pass { allowOffCurve: true }.`,
            { destination, reason: 'off-curve-nonexistent' },
        );
    }
}

/**
 * Builds a `transferSol` instruction after asserting the destination is a valid recipient via
 * {@link assertValidTransferSolDestination}. Async because the owner check requires an RPC;
 * otherwise equivalent to `getTransferSolInstruction`.
 */
export async function getTransferSolGuardedInstruction<
    TAccountSource extends string,
    TAccountDestination extends string,
>(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    input: TransferSolInput<TAccountSource, TAccountDestination>,
    config?: TransferSolGuardConfig,
): Promise<TransferSolInstruction<typeof SYSTEM_PROGRAM_ADDRESS, TAccountSource, TAccountDestination>> {
    await assertValidTransferSolDestination(rpc, input.destination, config);
    return getTransferSolInstruction<TAccountSource, TAccountDestination, typeof SYSTEM_PROGRAM_ADDRESS>(input);
}
