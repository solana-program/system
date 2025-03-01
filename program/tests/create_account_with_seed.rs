mod setup;

use {
    mollusk_svm::result::Check,
    solana_account::Account,
    solana_account_info::MAX_PERMITTED_DATA_INCREASE,
    solana_program_error::ProgramError,
    solana_pubkey::Pubkey,
    solana_system_interface::{
        error::SystemError, instruction::create_account_with_seed, MAX_PERMITTED_DATA_LENGTH,
    },
};

const LAMPORTS: u64 = 1_000;
const SPACE: u64 = 1_024;
const OWNER: Pubkey = Pubkey::new_from_array([8; 32]);

const BASE: Pubkey = Pubkey::new_from_array([8; 32]);
const SEED: &str = "seed";

#[test]
fn fail_address_with_seed_mismatch() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::new_unique();

    let to_account = Account {
        lamports: 1, // Has lamports
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            SPACE,
            &OWNER,
        ),
        &[
            (from_pubkey, Account::default()),
            (to_pubkey, to_account),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::Custom(
            SystemError::AddressWithSeedMismatch as u32,
        ))],
    );
}

#[test]
fn fail_to_has_lamports() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let to_account = Account {
        lamports: 1, // Has lamports
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            SPACE,
            &OWNER,
        ),
        &[
            (from_pubkey, Account::default()),
            (to_pubkey, to_account),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::Custom(
            SystemError::AccountAlreadyInUse as u32,
        ))],
    );
}

#[test]
fn fail_base_not_signer() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let mut instruction = create_account_with_seed(
        &from_pubkey,
        &to_pubkey,
        &BASE,
        SEED,
        LAMPORTS,
        SPACE,
        &OWNER,
    );
    instruction.accounts[2].is_signer = false;

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
fn fail_to_data_not_empty() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let to_account = Account {
        data: vec![4; 32], // Has data
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            SPACE,
            &OWNER,
        ),
        &[
            (from_pubkey, Account::default()),
            (to_pubkey, to_account),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::Custom(
            SystemError::AccountAlreadyInUse as u32,
        ))],
    );
}

#[test]
fn fail_to_invalid_owner() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let to_account = Account {
        owner: Pubkey::new_unique(), // Invalid owner
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            SPACE,
            &OWNER,
        ),
        &[
            (from_pubkey, Account::default()),
            (to_pubkey, to_account),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::Custom(
            SystemError::AccountAlreadyInUse as u32,
        ))],
    );
}

#[test]
fn fail_space_too_large() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let space_too_large = MAX_PERMITTED_DATA_LENGTH + 1;

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            space_too_large as u64,
            &OWNER,
        ),
        &[
            (from_pubkey, Account::default()),
            (to_pubkey, Account::default()),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::Custom(
            SystemError::InvalidAccountDataLength as u32,
        ))],
    );
}

// [TODO: CORE_BPF]: This verifies the concern for the `realloc` issue.
#[test]
fn fail_space_too_large_for_realloc() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let space_too_large_for_realloc = MAX_PERMITTED_DATA_INCREASE + 1;

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            space_too_large_for_realloc as u64,
            &OWNER,
        ),
        &[
            (from_pubkey, Account::default()),
            (to_pubkey, Account::default()),
            (BASE, Account::default()),
        ],
        &[Check::err(ProgramError::InvalidRealloc)], // See...?
    );
}

#[test]
fn fail_from_not_signer() {
    let mollusk = setup::setup();

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let mut instruction = create_account_with_seed(
        &from_pubkey,
        &to_pubkey,
        &BASE,
        SEED,
        LAMPORTS,
        SPACE,
        &OWNER,
    );
    instruction.accounts[0].is_signer = false;

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

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let from_account = Account {
        data: vec![4; 32], // Has data
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            SPACE,
            &OWNER,
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

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let from_account = Account {
        lamports: LAMPORTS - 1, // Insufficient lamports
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            SPACE,
            &OWNER,
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

    let from_pubkey = Pubkey::new_unique();
    let to_pubkey = Pubkey::create_with_seed(&BASE, &SEED, &OWNER).unwrap();

    let from_rent_exempt_lamports = mollusk.sysvars.rent.minimum_balance(0);

    let from_account = Account {
        lamports: LAMPORTS + from_rent_exempt_lamports,
        ..Account::default()
    };

    mollusk.process_and_validate_instruction(
        &create_account_with_seed(
            &from_pubkey,
            &to_pubkey,
            &BASE,
            SEED,
            LAMPORTS,
            SPACE,
            &OWNER,
        ),
        &[
            (from_pubkey, from_account),
            (to_pubkey, Account::default()),
            (BASE, Account::default()),
        ],
        &[
            Check::success(),
            Check::account(&from_pubkey)
                .lamports(from_rent_exempt_lamports) // `LAMPORTS` debited
                .build(),
            Check::account(&to_pubkey)
                .lamports(LAMPORTS)
                .owner(&OWNER)
                .space(SPACE as usize)
                .build(),
        ],
    );
}
