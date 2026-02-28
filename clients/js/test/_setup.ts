import {
    ClientWithPayer,
    ClientWithRpc,
    GetMinimumBalanceForRentExemptionApi,
    TransactionSigner,
    sequentialInstructionPlan,
} from '@solana/kit';
import { createLocalClient } from '@solana/kit-client-rpc';
import {
    SYSTEM_PROGRAM_ADDRESS,
    getCreateAccountInstruction,
    getInitializeNonceAccountInstruction,
    getNonceSize,
    systemProgram,
} from '../src';

export const createClient = () => {
    return createLocalClient().use(systemProgram());
};

export const getCreateNonceInstructionPlan = async (
    client: ClientWithPayer & ClientWithRpc<GetMinimumBalanceForRentExemptionApi>,
    nonce: TransactionSigner,
    nonceAuthority: TransactionSigner,
) => {
    const space = BigInt(getNonceSize());
    const rent = await client.rpc.getMinimumBalanceForRentExemption(space).send();

    return sequentialInstructionPlan([
        getCreateAccountInstruction({
            payer: client.payer,
            newAccount: nonce,
            lamports: rent,
            space,
            programAddress: SYSTEM_PROGRAM_ADDRESS,
        }),
        getInitializeNonceAccountInstruction({
            nonceAccount: nonce.address,
            nonceAuthority: nonceAuthority.address,
        }),
    ]);
};
