//! Program processor.

use {
    solana_account_info::AccountInfo,
    solana_msg::msg,
    solana_program_error::{ProgramError, ProgramResult},
    solana_pubkey::Pubkey,
    solana_system_interface::{
        error::SystemError, instruction::SystemInstruction, MAX_PERMITTED_DATA_LENGTH,
    },
    std::collections::HashSet,
};

// Maximum input buffer length that can be deserialized.
// See `solana_sdk::packet::PACKET_DATA_SIZE`.
const MAX_INPUT_LEN: u64 = 1232;

macro_rules! accounts {
    ( $infos:ident, $( $i:literal => $name:ident ),* $(,)? ) => {
        $(
            let $name = $infos.get($i).ok_or(ProgramError::NotEnoughAccountKeys)?;
        )*
    };
    ( $infos:ident, $signers:ident, $( $i:literal => $name:ident ),* $(,)? ) => {
        let mut $signers = HashSet::new();
        $(
            let $name = $infos.get($i).ok_or(ProgramError::NotEnoughAccountKeys)?;
            if $name.is_signer {
                $signers.insert(*$name.key);
            }
        )*
    };
}

// Represents an address that may or may not have been generated from a seed.
#[derive(Debug)]
struct Address {
    address: Pubkey,
    base: Option<Pubkey>,
}

impl Address {
    fn is_signer(&self, signers: &HashSet<Pubkey>) -> bool {
        if let Some(base) = self.base {
            signers.contains(&base)
        } else {
            signers.contains(&self.address)
        }
    }

    fn create(
        address: &Pubkey,
        with_seed: Option<(&Pubkey, &str, &Pubkey)>,
    ) -> Result<Self, ProgramError> {
        let base = if let Some((base, seed, owner)) = with_seed {
            // Re-derive the address. It must match the supplied address.
            let address_with_seed = Pubkey::create_with_seed(base, seed, owner)?;
            if *address != address_with_seed {
                msg!(
                    "Create: address {} does not match derived address {}",
                    address,
                    address_with_seed
                );
                Err(SystemError::AddressWithSeedMismatch)?
            }
            Some(*base)
        } else {
            None
        };

        Ok(Self {
            address: *address,
            base,
        })
    }
}

fn allocate(
    info: &AccountInfo,
    address: &Address,
    space: u64,
    signers: &HashSet<Pubkey>,
) -> Result<(), ProgramError> {
    if !address.is_signer(signers) {
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

    Unless we want to do 1,024 reallocs here, we probably need a new,
    permissioned syscall.
     */
    info.realloc(space as usize, true)?;

    Ok(())
}

fn assign(
    info: &AccountInfo,
    address: &Address,
    owner: &Pubkey,
    signers: &HashSet<Pubkey>,
) -> Result<(), ProgramError> {
    // No work to do, just return.
    if info.owner == owner {
        return Ok(());
    }

    if !address.is_signer(signers) {
        msg!("Assign: account {:?} must sign", address);
        Err(ProgramError::MissingRequiredSignature)?
    }

    info.assign(owner);

    Ok(())
}

fn transfer_verified(
    from_info: &AccountInfo,
    to_info: &AccountInfo,
    lamports: u64,
) -> Result<(), ProgramError> {
    if !from_info.data_is_empty() {
        msg!("Transfer: `from` must not carry data");
        Err(ProgramError::InvalidArgument)?
    }

    if from_info.lamports() < lamports {
        msg!(
            "Transfer: insufficient lamports {}, need {}",
            from_info.lamports(),
            lamports
        );
        Err(SystemError::ResultWithNegativeLamports)?
    }

    let new_to_lamports = to_info
        .lamports()
        .checked_add(lamports)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    let new_from_lamports = from_info
        .lamports()
        .checked_sub(lamports)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    **to_info.try_borrow_mut_lamports()? = new_to_lamports;
    **from_info.try_borrow_mut_lamports()? = new_from_lamports;

    Ok(())
}

fn transfer(
    from_info: &AccountInfo,
    to_info: &AccountInfo,
    lamports: u64,
) -> Result<(), ProgramError> {
    if !from_info.is_signer {
        msg!("Transfer: `from` account {} must sign", from_info.key);
        Err(ProgramError::MissingRequiredSignature)?
    }

    transfer_verified(from_info, to_info, lamports)
}

fn create_account(
    from_info: &AccountInfo,
    to_info: &AccountInfo,
    to_address: &Address,
    lamports: u64,
    space: u64,
    owner: &Pubkey,
    signers: &HashSet<Pubkey>,
) -> Result<(), ProgramError> {
    // If it looks like the `to` account is already in use, bail.
    if to_info.lamports() > 0 {
        msg!("Create Account: account {:?} already in use", to_info.key);
        Err(SystemError::AccountAlreadyInUse)?
    }

    allocate(to_info, to_address, space, signers)?;
    assign(to_info, to_address, owner, signers)?;
    transfer(from_info, to_info, lamports)?;

    Ok(())
}

fn process_allocate(accounts: &[AccountInfo], space: u64) -> ProgramResult {
    accounts!(
        accounts,
        signers,
        0 => account_info,
    );

    let address = Address::create(account_info.key, None)?;

    allocate(account_info, &address, space, &signers)
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
        signers,
        0 => account_info,
        1 => base_info,
    );

    let address = Address::create(account_info.key, Some((&base, &seed, &owner)))?;

    allocate(account_info, &address, space, &signers)?;
    assign(account_info, &address, &owner, &signers)
}

fn process_assign(accounts: &[AccountInfo], owner: Pubkey) -> ProgramResult {
    accounts!(
        accounts,
        signers,
        0 => account_info,
    );

    let address = Address::create(account_info.key, None)?;

    assign(account_info, &address, &owner, &signers)
}

fn process_assign_with_seed(
    accounts: &[AccountInfo],
    base: Pubkey,
    seed: String,
    owner: Pubkey,
) -> ProgramResult {
    accounts!(
        accounts,
        signers,
        0 => account_info,
        1 => base_info,
    );

    let address = Address::create(account_info.key, Some((&base, &seed, &owner)))?;

    assign(account_info, &address, &owner, &signers)
}

fn process_transfer(accounts: &[AccountInfo], lamports: u64) -> ProgramResult {
    accounts!(
        accounts,
        0 => from_info,
        1 => to_info,
    );

    transfer(from_info, to_info, lamports)
}

fn process_transfer_with_seed(
    accounts: &[AccountInfo],
    from_seed: String,
    from_owner: Pubkey,
    lamports: u64,
) -> ProgramResult {
    accounts!(
        accounts,
        0 => from_info,
        1 => from_base_info,
        2 => to_info,
    );

    if !from_base_info.is_signer {
        msg!(
            "Transfer: 'from_base' account {:?} must sign",
            from_base_info.key,
        );
        Err(ProgramError::MissingRequiredSignature)?
    }

    let address_from_seed = Pubkey::create_with_seed(from_base_info.key, &from_seed, &from_owner)?;

    if *from_info.key != address_from_seed {
        msg!(
            "Transfer: 'from' address {} does not match derived address {}",
            from_info.key,
            address_from_seed
        );
        Err(SystemError::AddressWithSeedMismatch)?
    }

    transfer_verified(from_info, to_info, lamports)
}

fn process_create_account(
    accounts: &[AccountInfo],
    lamports: u64,
    space: u64,
    owner: Pubkey,
) -> ProgramResult {
    accounts!(
        accounts,
        signers,
        0 => from_info,
        1 => to_info,
    );

    let to_address = Address::create(to_info.key, None)?;

    create_account(
        from_info,
        to_info,
        &to_address,
        lamports,
        space,
        &owner,
        &signers,
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
        SystemInstruction::AssignWithSeed { base, seed, owner } => {
            msg!("Instruction: AssignWithSeed");
            process_assign_with_seed(accounts, base, seed, owner)
        }
        SystemInstruction::Transfer { lamports } => {
            msg!("Instruction: Transfer");
            process_transfer(accounts, lamports)
        }
        SystemInstruction::TransferWithSeed {
            lamports,
            from_seed,
            from_owner,
        } => {
            msg!("Instruction: TransferWithSeed");
            process_transfer_with_seed(accounts, from_seed, from_owner, lamports)
        }
        SystemInstruction::CreateAccount {
            lamports,
            space,
            owner,
        } => {
            msg!("Instruction: CreateAccount");
            process_create_account(accounts, lamports, space, owner)
        }
        /* TODO: Remaining instruction implementations... */
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
