import {
    fetchEncodedAccount,
    isOffCurveAddress,
    type Address,
    type FetchAccountConfig,
    type GetAccountInfoApi,
    type Rpc,
} from '@solana/kit';
import {
    getAddressFromResolvedInstructionAccount,
    type InstructionAccountInput,
} from '@solana/kit/program-client-core';

import { SYSTEM_PROGRAM_ADDRESS } from './generated';

/** Distinguishes why a destination was rejected by {@link assertValidTransferSolDestination}. */
export type InvalidTransferSolDestinationReason = 'unexpected-owner' | 'unfunded-recipient' | 'off-curve';

/**
 * Thrown by {@link assertValidTransferSolDestination} when a destination is rejected. `owner` is set only
 * when `reason` is `'unexpected-owner'`.
 */
export class InvalidTransferSolDestinationError extends Error {
    override readonly name = 'InvalidTransferSolDestinationError';

    constructor(
        message: string,
        readonly destination: Address,
        readonly reason: InvalidTransferSolDestinationReason,
        readonly owner?: Address,
    ) {
        super(message);
    }
}

/**
 * Options for {@link assertValidTransferSolDestination}. Any {@link FetchAccountConfig} fields are passed
 * through to the account fetch.
 */
export type AssertValidTransferSolDestinationConfig = FetchAccountConfig & {
    /**
     * Allow a destination that has no account on-chain yet, funding it as part of the transfer.
     * Defaults to `false`, since an unfunded recipient is often a mistyped address.
     */
    allowUnfundedRecipient?: boolean;
    /**
     * Allow an off-curve (program-derived) destination, existing or not. Defaults to `true`, since
     * program-controlled wallets such as multisigs are common, legitimate recipients; set to `false` to
     * reject off-curve destinations until the recipient confirms they control them.
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
 * an {@link InvalidTransferSolDestinationError} with one of these reasons:
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
    rpc: Rpc<GetAccountInfoApi>,
    destinationInput: InstructionAccountInput,
    config?: AssertValidTransferSolDestinationConfig,
): Promise<void> {
    const destination = getAddressFromResolvedInstructionAccount('destination', destinationInput);
    const {
        allowOffCurve = true,
        allowUnfundedRecipient = false,
        programOwner = SYSTEM_PROGRAM_ADDRESS,
        ...fetchConfig
    } = config ?? {};
    const account = await fetchEncodedAccount(rpc, destination, fetchConfig);

    if (account.exists) {
        if (account.programAddress !== programOwner) {
            throw new InvalidTransferSolDestinationError(
                `Refusing to transfer SOL to ${destination}: it is owned by program ${account.programAddress}, not the expected program (${programOwner}).`,
                destination,
                'unexpected-owner',
                account.programAddress,
            );
        }
    } else if (!allowUnfundedRecipient) {
        throw new InvalidTransferSolDestinationError(
            `Refusing to transfer SOL to ${destination}: it has no account on-chain yet, which often means the address is mistyped. If you intend to fund a new account, pass { allowUnfundedRecipient: true }.`,
            destination,
            'unfunded-recipient',
        );
    }

    if (isOffCurveAddress(destination) && !allowOffCurve) {
        throw new InvalidTransferSolDestinationError(
            `Refusing to transfer SOL to ${destination}: it is an off-curve (program-derived) address, which no keypair controls. It may be a program-controlled account such as a multisig or smart wallet; once the recipient confirms they control it, pass { allowOffCurve: true }.`,
            destination,
            'off-curve',
        );
    }
}
