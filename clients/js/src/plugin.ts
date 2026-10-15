import { extendClient, pipe } from '@solana/kit';
import { addSelfPlanAndSendFunctions, type SelfPlanAndSendFunctions } from '@solana/kit/program-client-core';

import {
    systemProgram as generatedSystemProgram,
    type SystemPlugin as GeneratedSystemPlugin,
    type SystemPluginInstructions as GeneratedSystemPluginInstructions,
    type SystemPluginRequirements,
    type TransferSolInput,
} from './generated';
import { getTransferSolGuardedInstruction, type TransferSolGuardConfig } from './transferSolGuarded';

export type SystemPlugin = Omit<GeneratedSystemPlugin, 'instructions'> & { instructions: SystemPluginInstructions };

export type SystemPluginInstructions = GeneratedSystemPluginInstructions & {
    /** Like `transferSol`, but rejects destinations that fail `assertValidTransferSolDestination`. */
    transferSolGuarded: (
        input: TransferSolInput,
        config?: TransferSolGuardConfig,
    ) => ReturnType<typeof getTransferSolGuardedInstruction> & SelfPlanAndSendFunctions;
};

export function systemProgram() {
    return <T extends SystemPluginRequirements>(client: T) => {
        return pipe(client, generatedSystemProgram(), c =>
            extendClient(c, {
                system: <SystemPlugin>{
                    ...c.system,
                    instructions: {
                        ...c.system.instructions,
                        transferSolGuarded: (input, config) =>
                            addSelfPlanAndSendFunctions(
                                client,
                                getTransferSolGuardedInstruction(client.rpc, input, config),
                            ),
                    },
                },
            }),
        );
    };
}
