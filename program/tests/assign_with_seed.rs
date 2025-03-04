mod setup;

use {
    mollusk_svm::result::Check,
    solana_account::Account,
    solana_program_error::ProgramError,
    solana_pubkey::Pubkey,
    solana_system_interface::{error::SystemError, instruction::assign_with_seed},
};

const BASE: Pubkey = Pubkey::new_from_array([6; 32]);
const OWNER: Pubkey = Pubkey::new_from_array([8; 32]);
const SEED: &str = "seed";

#[test]
fn fail_address_with_seed_mismatch() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique(); // Not derived from base + seed.

    mollusk.process_and_validate_instruction(
        &assign_with_seed(&pubkey, &BASE, SEED, &OWNER),
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

    let mut instruction = assign_with_seed(&pubkey, &BASE, SEED, &OWNER);
    instruction.accounts[1].is_signer = false;

    mollusk.process_and_validate_instruction(
        &instruction,
        &[(pubkey, Account::default()), (BASE, Account::default())],
        &[Check::err(ProgramError::MissingRequiredSignature)],
    );
}

#[test]
fn success() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    mollusk.process_and_validate_instruction(
        &assign_with_seed(&pubkey, &BASE, SEED, &OWNER),
        &[(pubkey, Account::default()), (BASE, Account::default())],
        &[
            Check::success(),
            Check::account(&pubkey).owner(&OWNER).build(),
        ],
    );
}

#[test]
fn success_already_assigned() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let account = Account {
        owner: OWNER, // Already assigned
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &assign_with_seed(&pubkey, &BASE, SEED, &OWNER),
        &[(pubkey, account), (BASE, Account::default())],
        &[
            Check::success(),
            Check::account(&pubkey).owner(&OWNER).build(),
        ],
    );
}
