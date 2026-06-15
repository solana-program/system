import { fetchEncodedAccount, isOffCurveAddress, type Address, type FetchAccountConfig } from '@solana/kit';

import {
    getTransferSolInstruction,
    SYSTEM_PROGRAM_ADDRESS,
    type TransferSolInput,
    type TransferSolInstruction,
} from './generated';

/** Distinguishes why a destination was rejected by {@link assertValidTransferSolDestination}. */
export type InvalidTransferSolDestinationReason = 'non-system-owner' | 'off-curve-nonexistent';

/** Options for validating a SOL-transfer destination. Extends {@link FetchAccountConfig}. */
export type TransferSolGuardConfig = FetchAccountConfig & {
    /**
     * Allow a destination that has no account on-chain and is off-curve (a program-derived address).
     * Has no effect on accounts that already exist. Defaults to `false`.
     */
    allowOffCurve?: boolean;
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
 * A destination is valid when it is either an account already owned by the System Program, or an
 * address with no account on-chain that a keypair could still control (on-curve). An existing
 * account owned by any other program — most commonly an SPL token mint — is rejected, since SOL
 * sent to it is typically unrecoverable. A non-existent off-curve address is rejected unless
 * `allowOffCurve` is set.
 *
 * Reads the destination's on-chain owner, so an RPC supporting `getAccountInfo` is required.
 */
export async function assertValidTransferSolDestination(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    destination: Address,
    config?: TransferSolGuardConfig,
): Promise<void> {
    const account = await fetchEncodedAccount(rpc, destination, config);

    if (account.exists) {
        if (account.programAddress !== SYSTEM_PROGRAM_ADDRESS) {
            throw new InvalidTransferSolDestinationError(
                `Refusing to transfer SOL to ${destination}: it is owned by program ${account.programAddress}, not the System Program (${SYSTEM_PROGRAM_ADDRESS}). It is likely an SPL token mint or another program account, and SOL sent to it would be unrecoverable. Verify the recipient is a wallet address.`,
                { destination, owner: account.programAddress, reason: 'non-system-owner' },
            );
        }
        return;
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
