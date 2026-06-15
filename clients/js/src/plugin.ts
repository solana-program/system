import { extendClient } from '@solana/kit';
import { addSelfPlanAndSendFunctions, type SelfPlanAndSendFunctions } from '@solana/kit/program-client-core';

import {
    getTransferSolInstruction,
    systemProgram as generatedSystemProgram,
    type SystemPlugin,
    type SystemPluginInstructions,
    type SystemPluginRequirements,
    type TransferSolInput,
} from './generated';
import { getTransferSolGuardedInstruction, type TransferSolGuardConfig } from './transferSolGuarded';

export type SystemPluginInstructionsWithGuard = SystemPluginInstructions & {
    transferSolGuarded: (
        input: TransferSolInput,
        config?: TransferSolGuardConfig,
    ) => SelfPlanAndSendFunctions & Promise<ReturnType<typeof getTransferSolInstruction>>;
};

export type SystemPluginWithGuard = Omit<SystemPlugin, 'instructions'> & {
    instructions: SystemPluginInstructionsWithGuard;
};

export function systemProgram() {
    return <T extends SystemPluginRequirements>(client: T): Omit<T, 'system'> & { system: SystemPluginWithGuard } => {
        const { system } = generatedSystemProgram()(client);
        return extendClient(client, {
            system: {
                ...system,
                instructions: {
                    ...system.instructions,
                    transferSolGuarded: (input: TransferSolInput, config?: TransferSolGuardConfig) =>
                        addSelfPlanAndSendFunctions(
                            client,
                            getTransferSolGuardedInstruction(client.rpc, input, config),
                        ),
                },
            } as SystemPluginWithGuard,
        });
    };
}
