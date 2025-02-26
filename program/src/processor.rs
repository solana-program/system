//! Program processor.

use {
    solana_account_info::AccountInfo,
    solana_msg::msg,
    solana_program_error::{ProgramError, ProgramResult},
    solana_pubkey::Pubkey,
    solana_system_interface::{
        error::SystemError, instruction::SystemInstruction, MAX_PERMITTED_DATA_LENGTH,
    },
};

// Maximum input buffer length that can be deserialized.
// https://github.com/anza-xyz/solana-sdk/blob/41c663a8ec7269aa1117a2e3b0e24ff9ee1ac4af/packet/src/lib.rs#L32
const MAX_INPUT_LEN: u64 = 1232;

macro_rules! accounts {
    ( $infos:ident, $( $i:literal => $name:ident ),* $(,)? ) => {
        $(
            let $name = $infos.get($i).ok_or(ProgramError::NotEnoughAccountKeys)?;
        )*
    };
}

// Represents an address that may or may not have been generated from a seed.
struct AddressInfo<'a, 'b> {
    info: &'a AccountInfo<'b>,
    base: Option<(&'a Pubkey, &'a AccountInfo<'b>)>,
}

impl std::fmt::Debug for AddressInfo<'_, '_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AddressInfo")
            .field("address", &self.info.key)
            .field("base", &self.base.map(|(key, _)| key))
            .finish()
    }
}

impl<'a, 'b> AddressInfo<'a, 'b> {
    fn is_signer(&self) -> bool {
        /*
        [CORE_BPF]:
        This is pretty ugly, but...

        For some reason, the program asks for the base address _and_ the
        base account, which are supposed to be the same account.

        In the original builtin, the key is validated against the
        account when this method is called, since it would search the
        `signers` hash map for the keyed account matching the provided base
        address.

        To preserve identical functionality, including the timing at which
        errors are thrown, we inject the check here.
         */
        if let Some((base_key, base_info)) = self.base {
            base_key == base_info.key && base_info.is_signer
        } else {
            self.info.is_signer
        }
    }

    fn create(
        info: &'a AccountInfo<'b>,
        with_seed: Option<(&'a Pubkey, &'a AccountInfo<'b>, &str, &Pubkey)>,
    ) -> Result<Self, ProgramError> {
        let base = if let Some((base_key, base_info, seed, owner)) = with_seed {
            // Re-derive the address. It must match the supplied address.
            let address_with_seed = Pubkey::create_with_seed(base_key, seed, owner)?;
            if *info.key != address_with_seed {
                msg!(
                    "Create: address {} does not match derived address {}",
                    info.key,
                    address_with_seed
                );
                Err(SystemError::AddressWithSeedMismatch)?
            }
            Some((base_key, base_info))
        } else {
            None
        };

        Ok(Self { info, base })
    }
}

fn allocate(info: &AccountInfo, address: &AddressInfo, space: u64) -> Result<(), ProgramError> {
    if !address.is_signer() {
        msg!("Allocate: 'to' account {:?} must sign", address);
        Err(ProgramError::MissingRequiredSignature)?
    }

    // If it looks like the account is already in use, bail.
    if !info.data_is_empty() || !solana_system_interface::program::check_id(info.owner) {
        msg!("Allocate: account {:?} already in use", address);
        Err(SystemError::AccountAlreadyInUse)?
    }

    if space > MAX_PERMITTED_DATA_LENGTH {
        msg!(
            "Allocate: requested {}, max allowed {}",
            space,
            MAX_PERMITTED_DATA_LENGTH
        );
        Err(SystemError::InvalidAccountDataLength)?
    }

    /*
    [TODO: CORE_BPF]:

    This is going to behave differently than the builtin program right now,
    since reallocations are limited to `MAX_PERMITTED_DATA_INCREASE``, which is
    smaller than `MAX_PERMITTED_DATA_LENGTH`.

    * `MAX_PERMITTED_DATA_LENGTH`   : 1_024 * 10 * 1_024
    * `MAX_PERMITTED_DATA_INCREASE` : 1_024 * 10

    https://github.com/solana-program/system/issues/30
     */
    info.realloc(space as usize, true)
}

fn assign(info: &AccountInfo, address: &AddressInfo, owner: &Pubkey) -> Result<(), ProgramError> {
    // No work to do, just return.
    if info.owner == owner {
        return Ok(());
    }

    if !address.is_signer() {
        msg!("Assign: account {:?} must sign", address);
        Err(ProgramError::MissingRequiredSignature)?
    }

    info.assign(owner);

    Ok(())
}

fn process_allocate(accounts: &[AccountInfo], space: u64) -> ProgramResult {
    accounts!(
        accounts,
        0 => account_info,
    );
    allocate(
        account_info,
        &AddressInfo::create(account_info, None)?,
        space,
    )
}

fn process_allocate_with_seed(
    accounts: &[AccountInfo],
    base: Pubkey,
    seed: String,
    space: u64,
    owner: Pubkey,
) -> ProgramResult {
    accounts!(
        accounts,
        0 => account_info,
        1 => base_info,
    );

    let address = AddressInfo::create(account_info, Some((&base, base_info, &seed, &owner)))?;

    // [CORE_BPF]: The original builtin also does both `allocate` & `assign` here.
    // See https://github.com/anza-xyz/agave/blob/b31e5f47f9b9190a3c566f6d13c3f37422961071/programs/system/src/system_processor.rs#L518.
    allocate(account_info, &address, space)?;
    assign(account_info, &address, &owner)
}

fn process_assign(accounts: &[AccountInfo], owner: Pubkey) -> ProgramResult {
    accounts!(
        accounts,
        0 => account_info,
    );

    let address = AddressInfo::create(account_info, None)?;

    assign(account_info, &address, &owner)
}

pub fn process(_program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
    match solana_bincode::limited_deserialize::<SystemInstruction>(input, MAX_INPUT_LEN)
        .map_err(|_| ProgramError::InvalidInstructionData)?
    {
        SystemInstruction::Allocate { space } => {
            msg!("Instruction: Allocate");
            process_allocate(accounts, space)
        }
        SystemInstruction::AllocateWithSeed {
            base,
            seed,
            space,
            owner,
        } => {
            msg!("Instruction: AllocateWithSeed");
            process_allocate_with_seed(accounts, base, seed, space, owner)
        }
        SystemInstruction::Assign { owner } => {
            msg!("Instruction: Assign");
            process_assign(accounts, owner)
        }
        /* TODO: Remaining instruction implementations... */
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
