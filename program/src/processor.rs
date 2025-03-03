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
    base: Option<&'a AccountInfo<'b>>,
}

impl std::fmt::Debug for AddressInfo<'_, '_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AddressInfo")
            .field("address", &self.info.key)
            .field("base", &self.base.map(|info| info.key))
            .finish()
    }
}

impl<'a, 'b> AddressInfo<'a, 'b> {
    fn is_signer(&self) -> bool {
        if let Some(base) = self.base {
            base.is_signer
        } else {
            self.info.is_signer
        }
    }

    fn create(
        info: &'a AccountInfo<'b>,
        with_seed: Option<(&'a AccountInfo<'b>, &str, &Pubkey)>,
    ) -> Result<Self, ProgramError> {
        let base = if let Some((base, seed, owner)) = with_seed {
            // Re-derive the address. It must match the supplied address.
            let address_with_seed = Pubkey::create_with_seed(base.key, seed, owner)?;
            if *info.key != address_with_seed {
                msg!(
                    "Create: address {} does not match derived address {}",
                    info.key,
                    address_with_seed
                );
                Err(SystemError::AddressWithSeedMismatch)?
            }
            Some(base)
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

pub fn process(_program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
    match solana_bincode::limited_deserialize::<SystemInstruction>(input, MAX_INPUT_LEN)
        .map_err(|_| ProgramError::InvalidInstructionData)?
    {
        SystemInstruction::Allocate { space } => {
            msg!("Instruction: Allocate");
            process_allocate(accounts, space)
        }
        /* TODO: Remaining instruction implementations... */
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
