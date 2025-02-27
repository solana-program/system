mod setup;

use {
    mollusk_svm::result::Check,
    solana_account::Account,
    solana_program_error::ProgramError,
    solana_pubkey::Pubkey,
    solana_system_interface::{error::SystemError, instruction::transfer_with_seed},
};

const AMOUNT: u64 = 1_000;
const BASE: Pubkey = Pubkey::new_from_array([6; 32]);
const OWNER: Pubkey = Pubkey::new_from_array([8; 32]);
const SEED: &str = "seed";

#[test]
fn fail_address_with_seed_mismatch() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique(); // Not derived from base + seed.
    let to_pubkey = Pubkey::new_unique();

    mollusk.process_and_validate_instruction(
        &transfer_with_seed(
            &from_pubkey,
            &BASE,
            SEED.to_string(),
            &OWNER,
            &to_pubkey,
            AMOUNT,
        ),
        &[
            (from_pubkey, Account::default()),
            (to_pubkey, Account::default()),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::Custom(
            SystemError::AddressWithSeedMismatch as u32,
        ))],
    );
}

#[test]
fn fail_base_not_signer() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();
    let to_pubkey = Pubkey::new_unique();

    let mut instruction = transfer_with_seed(
        &from_pubkey,
        &BASE,
        SEED.to_string(),
        &OWNER,
        &to_pubkey,
        AMOUNT,
    );
    instruction.accounts[1].is_signer = false;

    mollusk.process_and_validate_instruction(
        &instruction,
        &[
            (from_pubkey, Account::default()),
            (to_pubkey, Account::default()),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::MissingRequiredSignature)],
    );
}

#[test]
fn fail_from_has_data() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();
    let to_pubkey = Pubkey::new_unique();

    let from_account = Account {
        data: vec![4; 32], // Has data
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &transfer_with_seed(
            &from_pubkey,
            &BASE,
            SEED.to_string(),
            &OWNER,
            &to_pubkey,
            AMOUNT,
        ),
        &[
            (from_pubkey, from_account),
            (to_pubkey, Account::default()),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::InvalidArgument)],
    );
}

#[test]
fn fail_from_insufficient_lamports() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();
    let to_pubkey = Pubkey::new_unique();

    let from_account = Account {
        lamports: AMOUNT - 1, // Insufficient lamports
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &transfer_with_seed(
            &from_pubkey,
            &BASE,
            SEED.to_string(),
            &OWNER,
            &to_pubkey,
            AMOUNT,
        ),
        &[
            (from_pubkey, from_account),
            (to_pubkey, Account::default()),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::Custom(
            SystemError::ResultWithNegativeLamports as u32,
        ))],
    );
}

#[test]
fn success() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();
    let to_pubkey = Pubkey::new_unique();

    let base_rent = mollusk.sysvars.rent.minimum_balance(0);

    let from_account = Account {
        lamports: base_rent + AMOUNT,
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &transfer_with_seed(
            &from_pubkey,
            &BASE,
            SEED.to_string(),
            &OWNER,
            &to_pubkey,
            AMOUNT,
        ),
        &[
            (from_pubkey, from_account),
            (to_pubkey, Account::default()),
            (BASE, Account::default()),
        ],
        &[
            Check::success(),
            Check::account(&from_pubkey).lamports(base_rent).build(),
            Check::account(&to_pubkey).lamports(AMOUNT).build(),
        ],
    );
}

#[test]
fn success_to_account_exists() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();
    let to_pubkey = Pubkey::new_unique();

    let base_rent = mollusk.sysvars.rent.minimum_balance(0);
    let to_starting_lamports = 69;

    let from_account = Account {
        lamports: base_rent + AMOUNT,
        ..Account::default()
    };
    let to_account = Account {
        lamports: to_starting_lamports,
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &transfer_with_seed(
            &from_pubkey,
            &BASE,
            SEED.to_string(),
            &OWNER,
            &to_pubkey,
            AMOUNT,
        ),
        &[
            (from_pubkey, from_account),
            (to_pubkey, to_account),
            (BASE, Account::default()),
        ],
        &[
            Check::success(),
            Check::account(&from_pubkey).lamports(base_rent).build(),
            Check::account(&to_pubkey)
                .lamports(to_starting_lamports + AMOUNT)
                .build(),
        ],
    );
}
