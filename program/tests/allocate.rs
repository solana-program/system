mod setup;

use {
    mollusk_svm::result::Check,
    solana_account::Account,
    solana_account_info::MAX_PERMITTED_DATA_INCREASE,
    solana_program_error::ProgramError,
    solana_pubkey::Pubkey,
    solana_system_interface::{
        error::SystemError, instruction::allocate, MAX_PERMITTED_DATA_LENGTH,
    },
};

const SPACE: u64 = 10_000;

#[test]
fn fail_account_not_signer() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique();

    let mut instruction = allocate(&pubkey, SPACE);
    instruction.accounts[0].is_signer = false;

    mollusk.process_and_validate_instruction(
        &instruction,
        &[(pubkey, Account::default())],
        &[Check::err(ProgramError::MissingRequiredSignature)],
    );
}

#[test]
fn fail_account_already_in_use() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique();

    let account = Account {
        data: vec![4; 32], // Has data
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &allocate(&pubkey, SPACE),
        &[(pubkey, account)],
        &[Check::err(ProgramError::Custom(
            SystemError::AccountAlreadyInUse as u32,
        ))],
    );

    let account = Account {
        owner: Pubkey::new_unique(), // Not System
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &allocate(&pubkey, SPACE),
        &[(pubkey, account)],
        &[Check::err(ProgramError::Custom(
            SystemError::AccountAlreadyInUse as u32,
        ))],
    );
}

#[test]
fn fail_space_too_large() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique();

    let space_too_large = MAX_PERMITTED_DATA_LENGTH + 1;

    mollusk.process_and_validate_instruction(
        &allocate(&pubkey, space_too_large),
        &[(pubkey, Account::default())],
        &[Check::err(ProgramError::Custom(
            SystemError::InvalidAccountDataLength as u32,
        ))],
    );
}

// [TODO: CORE_BPF]: This verifies the concern for the `realloc` issue.
#[test]
fn fail_space_too_large_for_realloc() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique();

    let space_too_large_for_realloc = MAX_PERMITTED_DATA_INCREASE + 1;

    mollusk.process_and_validate_instruction(
        &allocate(&pubkey, space_too_large_for_realloc as u64),
        &[(pubkey, Account::default())],
        &[Check::err(ProgramError::InvalidRealloc)], // See...?
    );
}

#[test]
fn success() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique();

    mollusk.process_and_validate_instruction(
        &allocate(&pubkey, SPACE),
        &[(pubkey, Account::default())],
        &[
            Check::success(),
            Check::account(&pubkey).space(SPACE as usize).build(),
        ],
    );
}
