mod setup;

use {
    mollusk_svm::result::Check, solana_account::Account, solana_program_error::ProgramError,
    solana_pubkey::Pubkey, solana_system_interface::instruction::assign,
};

const OWNER: Pubkey = Pubkey::new_from_array([8; 32]);

#[test]
fn fail_account_not_signer() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique();

    let mut instruction = assign(&pubkey, &OWNER);
    instruction.accounts[0].is_signer = false;

    mollusk.process_and_validate_instruction(
        &instruction,
        &[(pubkey, Account::default())],
        &[Check::err(ProgramError::MissingRequiredSignature)],
    );
}

#[test]
fn success() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique();

    mollusk.process_and_validate_instruction(
        &assign(&pubkey, &OWNER),
        &[(pubkey, Account::default())],
        &[
            Check::success(),
            Check::account(&pubkey).owner(&OWNER).build(),
        ],
    );
}

#[test]
fn success_already_assigned() {
    let mollusk = setup::setup();

    let pubkey = Pubkey::new_unique();

    let account = Account {
        owner: OWNER, // Already assigned
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &assign(&pubkey, &OWNER),
        &[(pubkey, account)],
        &[
            Check::success(),
            Check::account(&pubkey).owner(&OWNER).build(),
        ],
    );
}
