import {
    ClientWithPayer,
    ClientWithRpc,
    GetMinimumBalanceForRentExemptionApi,
    TransactionSigner,
    createClient,
    lamports,
    sequentialInstructionPlan,
} from '@solana/kit';
import { solanaLocalRpc } from '@solana/kit-plugin-rpc';
import { airdropSigner, generatedSigner } from '@solana/kit-plugin-signer';
import {
    SYSTEM_PROGRAM_ADDRESS,
    getCreateAccountInstruction,
    getInitializeNonceAccountInstruction,
    getNonceSize,
    systemProgram,
} from '../src';

export const createTestClient = () => {
    return createClient()
        .use(generatedSigner())
        .use(solanaLocalRpc())
        .use(systemProgram())
        .use(airdropSigner(lamports(1_000_000_000n)));
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
