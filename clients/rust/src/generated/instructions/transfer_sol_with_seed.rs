//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;
use kaigan::types::U64PrefixString;
use solana_program::pubkey::Pubkey;

/// Accounts.
#[derive(Debug)]
pub struct TransferSolWithSeed {
    pub source: solana_program::pubkey::Pubkey,

    pub base_account: solana_program::pubkey::Pubkey,

    pub destination: solana_program::pubkey::Pubkey,
}

impl TransferSolWithSeed {
    pub fn instruction(
        &self,
        args: TransferSolWithSeedInstructionArgs,
    ) -> solana_program::instruction::Instruction {
        self.instruction_with_remaining_accounts(args, &[])
    }
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction_with_remaining_accounts(
        &self,
        args: TransferSolWithSeedInstructionArgs,
        remaining_accounts: &[solana_program::instruction::AccountMeta],
    ) -> solana_program::instruction::Instruction {
        let mut accounts = Vec::with_capacity(3 + remaining_accounts.len());
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.source,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.base_account,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.destination,
            false,
        ));
        accounts.extend_from_slice(remaining_accounts);
        let mut data = TransferSolWithSeedInstructionData::new()
            .try_to_vec()
            .unwrap();
        let mut args = args.try_to_vec().unwrap();
        data.append(&mut args);

        solana_program::instruction::Instruction {
            program_id: crate::SYSTEM_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct TransferSolWithSeedInstructionData {
    discriminator: u32,
}

impl TransferSolWithSeedInstructionData {
    pub fn new() -> Self {
        Self { discriminator: 11 }
    }
}

impl Default for TransferSolWithSeedInstructionData {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct TransferSolWithSeedInstructionArgs {
    pub amount: u64,
    pub from_seed: U64PrefixString,
    pub from_owner: Pubkey,
}

/// Instruction builder for `TransferSolWithSeed`.
///
/// ### Accounts:
///
///   0. `[writable]` source
///   1. `[signer]` base_account
///   2. `[writable]` destination
#[derive(Clone, Debug, Default)]
pub struct TransferSolWithSeedBuilder {
    source: Option<solana_program::pubkey::Pubkey>,
    base_account: Option<solana_program::pubkey::Pubkey>,
    destination: Option<solana_program::pubkey::Pubkey>,
    amount: Option<u64>,
    from_seed: Option<U64PrefixString>,
    from_owner: Option<Pubkey>,
    __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl TransferSolWithSeedBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    #[inline(always)]
    pub fn source(&mut self, source: solana_program::pubkey::Pubkey) -> &mut Self {
        self.source = Some(source);
        self
    }
    #[inline(always)]
    pub fn base_account(&mut self, base_account: solana_program::pubkey::Pubkey) -> &mut Self {
        self.base_account = Some(base_account);
        self
    }
    #[inline(always)]
    pub fn destination(&mut self, destination: solana_program::pubkey::Pubkey) -> &mut Self {
        self.destination = Some(destination);
        self
    }
    #[inline(always)]
    pub fn amount(&mut self, amount: u64) -> &mut Self {
        self.amount = Some(amount);
        self
    }
    #[inline(always)]
    pub fn from_seed(&mut self, from_seed: U64PrefixString) -> &mut Self {
        self.from_seed = Some(from_seed);
        self
    }
    #[inline(always)]
    pub fn from_owner(&mut self, from_owner: Pubkey) -> &mut Self {
        self.from_owner = Some(from_owner);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: solana_program::instruction::AccountMeta,
    ) -> &mut Self {
        self.__remaining_accounts.push(account);
        self
    }
    /// Add additional accounts to the instruction.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[solana_program::instruction::AccountMeta],
    ) -> &mut Self {
        self.__remaining_accounts.extend_from_slice(accounts);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        let accounts = TransferSolWithSeed {
            source: self.source.expect("source is not set"),
            base_account: self.base_account.expect("base_account is not set"),
            destination: self.destination.expect("destination is not set"),
        };
        let args = TransferSolWithSeedInstructionArgs {
            amount: self.amount.clone().expect("amount is not set"),
            from_seed: self.from_seed.clone().expect("from_seed is not set"),
            from_owner: self.from_owner.clone().expect("from_owner is not set"),
        };

        accounts.instruction_with_remaining_accounts(args, &self.__remaining_accounts)
    }
}

/// `transfer_sol_with_seed` CPI accounts.
pub struct TransferSolWithSeedCpiAccounts<'a, 'b> {
    pub source: &'b solana_program::account_info::AccountInfo<'a>,

    pub base_account: &'b solana_program::account_info::AccountInfo<'a>,

    pub destination: &'b solana_program::account_info::AccountInfo<'a>,
}

/// `transfer_sol_with_seed` CPI instruction.
pub struct TransferSolWithSeedCpi<'a, 'b> {
    /// The program to invoke.
    pub __program: &'b solana_program::account_info::AccountInfo<'a>,

    pub source: &'b solana_program::account_info::AccountInfo<'a>,

    pub base_account: &'b solana_program::account_info::AccountInfo<'a>,

    pub destination: &'b solana_program::account_info::AccountInfo<'a>,
    /// The arguments for the instruction.
    pub __args: TransferSolWithSeedInstructionArgs,
}

impl<'a, 'b> TransferSolWithSeedCpi<'a, 'b> {
    pub fn new(
        program: &'b solana_program::account_info::AccountInfo<'a>,
        accounts: TransferSolWithSeedCpiAccounts<'a, 'b>,
        args: TransferSolWithSeedInstructionArgs,
    ) -> Self {
        Self {
            __program: program,
            source: accounts.source,
            base_account: accounts.base_account,
            destination: accounts.destination,
            __args: args,
        }
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], &[])
    }
    #[inline(always)]
    pub fn invoke_with_remaining_accounts(
        &self,
        remaining_accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
    }
    #[inline(always)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed_with_remaining_accounts(
        &self,
        signers_seeds: &[&[&[u8]]],
        remaining_accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> solana_program::entrypoint::ProgramResult {
        let mut accounts = Vec::with_capacity(3 + remaining_accounts.len());
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.source.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.base_account.key,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.destination.key,
            false,
        ));
        remaining_accounts.iter().for_each(|remaining_account| {
            accounts.push(solana_program::instruction::AccountMeta {
                pubkey: *remaining_account.0.key,
                is_signer: remaining_account.1,
                is_writable: remaining_account.2,
            })
        });
        let mut data = TransferSolWithSeedInstructionData::new()
            .try_to_vec()
            .unwrap();
        let mut args = self.__args.try_to_vec().unwrap();
        data.append(&mut args);

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::SYSTEM_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(4 + remaining_accounts.len());
        account_infos.push(self.__program.clone());
        account_infos.push(self.source.clone());
        account_infos.push(self.base_account.clone());
        account_infos.push(self.destination.clone());
        remaining_accounts
            .iter()
            .for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// Instruction builder for `TransferSolWithSeed` via CPI.
///
/// ### Accounts:
///
///   0. `[writable]` source
///   1. `[signer]` base_account
///   2. `[writable]` destination
#[derive(Clone, Debug)]
pub struct TransferSolWithSeedCpiBuilder<'a, 'b> {
    instruction: Box<TransferSolWithSeedCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> TransferSolWithSeedCpiBuilder<'a, 'b> {
    pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(TransferSolWithSeedCpiBuilderInstruction {
            __program: program,
            source: None,
            base_account: None,
            destination: None,
            amount: None,
            from_seed: None,
            from_owner: None,
            __remaining_accounts: Vec::new(),
        });
        Self { instruction }
    }
    #[inline(always)]
    pub fn source(
        &mut self,
        source: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.source = Some(source);
        self
    }
    #[inline(always)]
    pub fn base_account(
        &mut self,
        base_account: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.base_account = Some(base_account);
        self
    }
    #[inline(always)]
    pub fn destination(
        &mut self,
        destination: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.destination = Some(destination);
        self
    }
    #[inline(always)]
    pub fn amount(&mut self, amount: u64) -> &mut Self {
        self.instruction.amount = Some(amount);
        self
    }
    #[inline(always)]
    pub fn from_seed(&mut self, from_seed: U64PrefixString) -> &mut Self {
        self.instruction.from_seed = Some(from_seed);
        self
    }
    #[inline(always)]
    pub fn from_owner(&mut self, from_owner: Pubkey) -> &mut Self {
        self.instruction.from_owner = Some(from_owner);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: &'b solana_program::account_info::AccountInfo<'a>,
        is_writable: bool,
        is_signer: bool,
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .push((account, is_writable, is_signer));
        self
    }
    /// Add additional accounts to the instruction.
    ///
    /// Each account is represented by a tuple of the `AccountInfo`, a `bool` indicating whether the account is writable or not,
    /// and a `bool` indicating whether the account is a signer or not.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .extend_from_slice(accounts);
        self
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let args = TransferSolWithSeedInstructionArgs {
            amount: self.instruction.amount.clone().expect("amount is not set"),
            from_seed: self
                .instruction
                .from_seed
                .clone()
                .expect("from_seed is not set"),
            from_owner: self
                .instruction
                .from_owner
                .clone()
                .expect("from_owner is not set"),
        };
        let instruction = TransferSolWithSeedCpi {
            __program: self.instruction.__program,

            source: self.instruction.source.expect("source is not set"),

            base_account: self
                .instruction
                .base_account
                .expect("base_account is not set"),

            destination: self
                .instruction
                .destination
                .expect("destination is not set"),
            __args: args,
        };
        instruction.invoke_signed_with_remaining_accounts(
            signers_seeds,
            &self.instruction.__remaining_accounts,
        )
    }
}

#[derive(Clone, Debug)]
struct TransferSolWithSeedCpiBuilderInstruction<'a, 'b> {
    __program: &'b solana_program::account_info::AccountInfo<'a>,
    source: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    base_account: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    destination: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    amount: Option<u64>,
    from_seed: Option<U64PrefixString>,
    from_owner: Option<Pubkey>,
    /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
    __remaining_accounts: Vec<(
        &'b solana_program::account_info::AccountInfo<'a>,
        bool,
        bool,
    )>,
}
