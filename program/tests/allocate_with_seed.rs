mod setup;

use {
    mollusk_svm::result::Check,
    solana_account::Account,
    solana_account_info::MAX_PERMITTED_DATA_INCREASE,
    solana_program_error::ProgramError,
    solana_pubkey::Pubkey,
    solana_system_interface::{
        error::SystemError, instruction::allocate_with_seed, MAX_PERMITTED_DATA_LENGTH,
    },
};

const BASE: Pubkey = Pubkey::new_from_array([6; 32]);
const OWNER: Pubkey = Pubkey::new_from_array([8; 32]);
const SEED: &str = "seed";
const SPACE: u64 = 10_000;

#[test]
fn fail_address_with_seed_mismatch() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique(); // Not derived from base + seed.

    mollusk.process_and_validate_instruction(
        &allocate_with_seed(&pubkey, &BASE, SEED, SPACE, &OWNER),
        &[(pubkey, Account::default()), (BASE, Account::default())],
        &[Check::err(ProgramError::Custom(
            SystemError::AddressWithSeedMismatch as u32,
        ))],
    );
}

#[test]
fn fail_base_not_signer() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let mut instruction = allocate_with_seed(&pubkey, &BASE, SEED, SPACE, &OWNER);
    instruction.accounts[1].is_signer = false;

    mollusk.process_and_validate_instruction(
        &instruction,
        &[(pubkey, Account::default()), (BASE, Account::default())],
        &[Check::err(ProgramError::MissingRequiredSignature)],
    );
}

#[test]
fn fail_account_already_in_use() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let account = Account {
        data: vec![4; 32], // Has data
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &allocate_with_seed(&pubkey, &BASE, SEED, SPACE, &OWNER),
        &[(pubkey, account), (BASE, Account::default())],
        &[Check::err(ProgramError::Custom(
            SystemError::AccountAlreadyInUse as u32,
        ))],
    );

    let account = Account {
        owner: Pubkey::new_unique(), // Not System
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &allocate_with_seed(&pubkey, &BASE, SEED, SPACE, &OWNER),
        &[(pubkey, account), (BASE, Account::default())],
        &[Check::err(ProgramError::Custom(
            SystemError::AccountAlreadyInUse as u32,
        ))],
    );
}

#[test]
fn fail_space_too_large() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let space_too_large = MAX_PERMITTED_DATA_LENGTH + 1;

    mollusk.process_and_validate_instruction(
        &allocate_with_seed(&pubkey, &BASE, SEED, space_too_large, &OWNER),
        &[(pubkey, Account::default()), (BASE, Account::default())],
        &[Check::err(ProgramError::Custom(
            SystemError::InvalidAccountDataLength as u32,
        ))],
    );
}

// [TODO: CORE_BPF]: This verifies the concern for the `realloc` issue.
#[test]
fn fail_space_too_large_for_realloc() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let space_too_large_for_realloc = MAX_PERMITTED_DATA_INCREASE + 1;

    mollusk.process_and_validate_instruction(
        &allocate_with_seed(
            &pubkey,
            &BASE,
            SEED,
            space_too_large_for_realloc as u64,
            &OWNER,
        ),
        &[(pubkey, Account::default()), (BASE, Account::default())],
        &[Check::err(ProgramError::InvalidRealloc)], // See...?
    );
}

#[test]
fn success() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    mollusk.process_and_validate_instruction(
        &allocate_with_seed(&pubkey, &BASE, SEED, SPACE, &OWNER),
        &[(pubkey, Account::default()), (BASE, Account::default())],
        &[
            Check::success(),
            Check::account(&pubkey)
                .owner(&OWNER)
                .space(SPACE as usize)
                .build(),
        ],
    );
}
