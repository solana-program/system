import {
    fetchEncodedAccount,
    isOffCurveAddress,
    type Address,
    type FetchAccountConfig,
    type HasAddress,
} from '@solana/kit';
import {
    getAddressFromResolvedInstructionAccount,
    type InstructionAccountInput,
    type InstructionSignerInput,
} from '@solana/kit/program-client-core';

import { getTransferSolInstruction, SYSTEM_PROGRAM_ADDRESS, type TransferSolInput } from './generated';

/** Distinguishes why a destination was rejected by {@link assertValidTransferSolDestination}. */
export type InvalidTransferSolDestinationReason = 'unexpected-owner' | 'unfunded-recipient' | 'off-curve';

/**
 * The `cause` of the `Error` thrown by {@link assertValidTransferSolDestination}. `owner` is set only
 * when `reason` is `'unexpected-owner'`.
 */
export type InvalidTransferSolDestinationCause = {
    destination: Address;
    reason: InvalidTransferSolDestinationReason;
    owner?: Address;
};

/**
 * Options for {@link assertValidTransferSolDestination}. Any {@link FetchAccountConfig} fields are passed
 * through to the account fetch.
 */
export type TransferSolGuardConfig = FetchAccountConfig & {
    /**
     * Allow a destination that has no account on-chain yet, funding it as part of the transfer.
     * Defaults to `false`, since an unfunded recipient is often a mistyped address.
     */
    allowUnfundedRecipient?: boolean;
    /**
     * Allow an off-curve (program-derived) destination, existing or not. Defaults to `true`; set to
     * `false` to reject off-curve destinations until the recipient confirms they control them.
     */
    allowOffCurve?: boolean;
    /**
     * The program an existing destination account must be owned by. Defaults to the System Program
     * ({@link SYSTEM_PROGRAM_ADDRESS}).
     */
    programOwner?: Address;
};

/**
 * Asserts that `destination` can safely receive a SOL transfer by fetching its account. Otherwise throws
 * an `Error` whose `cause` is an {@link InvalidTransferSolDestinationCause} with one of these reasons:
 *
 * - `'unexpected-owner'`: the account exists but is not owned by `programOwner` (the System Program by
 *   default), e.g. an SPL token mint. SOL sent to such an account is typically unrecoverable.
 * - `'unfunded-recipient'`: no account exists, which often means a mistyped address. Skipped when
 *   `allowUnfundedRecipient` is set.
 * - `'off-curve'`: the address is off-curve, existing or not, and may be a smart wallet the recipient
 *   must confirm they control. Only checked when `allowOffCurve` is `false`.
 *
 * The owner is checked first, so an off-curve account owned by another program, such as an associated
 * token account, reports `'unexpected-owner'`.
 */
export async function assertValidTransferSolDestination(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    destinationInput: Address | HasAddress,
    config?: TransferSolGuardConfig,
): Promise<void> {
    const destination = typeof destinationInput === 'string' ? destinationInput : destinationInput.address;
    const {
        allowOffCurve = true,
        allowUnfundedRecipient = false,
        programOwner = SYSTEM_PROGRAM_ADDRESS,
        ...fetchConfig
    } = config ?? {};
    const account = await fetchEncodedAccount(rpc, destination, fetchConfig);

    if (account.exists) {
        if (account.programAddress !== programOwner) {
            throw new Error(
                `Refusing to transfer SOL to ${destination}: it is owned by program ${account.programAddress}, not the expected program (${programOwner}).`,
                { cause: { destination, reason: 'unexpected-owner', owner: account.programAddress } },
            );
        }
    } else if (!allowUnfundedRecipient) {
        throw new Error(
            `Refusing to transfer SOL to ${destination}: it has no account on-chain yet, which often means the address is mistyped. If you intend to fund a new account, pass { allowUnfundedRecipient: true }.`,
            { cause: { destination, reason: 'unfunded-recipient' } },
        );
    }

    if (isOffCurveAddress(destination) && !allowOffCurve) {
        throw new Error(
            `Refusing to transfer SOL to ${destination}: it is an off-curve (program-derived) address, which no keypair controls. It may be a smart wallet (e.g. Squads or Swig); once the recipient confirms they control it, pass { allowOffCurve: true }.`,
            { cause: { destination, reason: 'off-curve' } },
        );
    }
}

/**
 * Builds a `transferSol` instruction after checking the destination with
 * {@link assertValidTransferSolDestination}. Accepts the same input as `getTransferSolInstruction`.
 */
export async function getTransferSolGuardedInstruction<
    TAccountSource extends InstructionSignerInput,
    TAccountDestination extends InstructionAccountInput,
>(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    input: TransferSolInput<TAccountSource, TAccountDestination>,
    config?: TransferSolGuardConfig,
): Promise<ReturnType<typeof getTransferSolInstruction<TAccountSource, TAccountDestination>>> {
    const destination = getAddressFromResolvedInstructionAccount('destination', input.destination);
    await assertValidTransferSolDestination(rpc, destination, config);
    return getTransferSolInstruction<TAccountSource, TAccountDestination, typeof SYSTEM_PROGRAM_ADDRESS>(input);
}
