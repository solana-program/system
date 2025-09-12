import {
  appendTransactionMessageInstruction,
  createAddressWithSeed,
  fetchEncodedAccount,
  generateKeyPairSigner,
  KeyPairSigner,
  pipe,
} from '@solana/kit';
import test, { ExecutionContext } from 'ava';
import { getCreateAccountWithSeedInstruction } from '../src';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup';

async function createAccountWithSeedTest(
  t: ExecutionContext<unknown>,
  baseIsPayer: boolean
) {
  const client = createDefaultSolanaClient();
  const space = 42n;
  const [payer, program, lamports] = await Promise.all([
    generateKeyPairSignerWithSol(client),
    generateKeyPairSigner(),
    client.rpc.getMinimumBalanceForRentExemption(space).send(),
  ]);
  let baseAccount = await generateKeyPairSigner();

  if (baseIsPayer) {
    baseAccount = payer;
  }

  const programAddress = program.address;
  const SEED = '123456789';
  const newAccount = await createAddressWithSeed({
    baseAddress: baseAccount.address,
    programAddress,
    seed: SEED,
  });

  let extraArgs: {} | { baseAccount: KeyPairSigner<string> } = {};
  if (!baseIsPayer) {
    extraArgs = { baseAccount };
  }

  // When we call createAccountWithSeed in a transaction.
  const createAccount = getCreateAccountWithSeedInstruction({
    payer,
    newAccount,
    base: baseAccount.address,
    seed: SEED,
    space,
    lamports,
    programAddress,
    ...extraArgs,
  });
  await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(createAccount, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then we expect the following account data.
  const fetchedAccount = await fetchEncodedAccount(client.rpc, newAccount);
  t.deepEqual(fetchedAccount, {
    executable: false,
    lamports,
    programAddress,
    address: newAccount,
    data: new Uint8Array(Array.from({ length: 42 }, () => 0)),
    exists: true,
    space: 42n,
  });
}

test('it creates a new empty account when base is not payer', (t) =>
  createAccountWithSeedTest(t, false));

test('it creates a new empty account when base is payer', (t) =>
  createAccountWithSeedTest(t, true));
