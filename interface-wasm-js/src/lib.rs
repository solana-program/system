//! `SystemInstruction` Javascript interface
#![allow(non_snake_case)]
use {
    solana_instruction::Instruction,
    solana_pubkey::Pubkey,
    solana_system_interface::instruction::{
        advance_nonce_account, allocate_with_seed, assign_with_seed, authorize_nonce_account,
        create_account, create_account_with_seed, create_nonce_account, transfer_with_seed,
        withdraw_nonce_account,
    },
    wasm_bindgen::prelude::*,
};

#[wasm_bindgen]
pub fn createAccount(
    from_pubkey: &Pubkey,
    to_pubkey: &Pubkey,
    lamports: u64,
    space: u64,
    owner: &Pubkey,
) -> Instruction {
    create_account(from_pubkey, to_pubkey, lamports, space, owner)
}

#[wasm_bindgen]
pub fn createAccountWithSeed(
    from_pubkey: &Pubkey,
    to_pubkey: &Pubkey,
    base: &Pubkey,
    seed: &str,
    lamports: u64,
    space: u64,
    owner: &Pubkey,
) -> Instruction {
    create_account_with_seed(from_pubkey, to_pubkey, base, seed, lamports, space, owner)
}

#[wasm_bindgen]
pub fn assign(pubkey: &Pubkey, owner: &Pubkey) -> Instruction {
    solana_system_interface::instruction::assign(pubkey, owner)
}

#[wasm_bindgen]
pub fn assignWithSeed(pubkey: &Pubkey, base: &Pubkey, seed: &str, owner: &Pubkey) -> Instruction {
    assign_with_seed(pubkey, base, seed, owner)
}

#[wasm_bindgen]
pub fn transfer(from_pubkey: &Pubkey, to_pubkey: &Pubkey, lamports: u64) -> Instruction {
    solana_system_interface::instruction::transfer(from_pubkey, to_pubkey, lamports)
}

#[wasm_bindgen]
pub fn transferWithSeed(
    from_pubkey: &Pubkey,
    from_base: &Pubkey,
    from_seed: String,
    from_owner: &Pubkey,
    to_pubkey: &Pubkey,
    lamports: u64,
) -> Instruction {
    transfer_with_seed(
        from_pubkey,
        from_base,
        from_seed,
        from_owner,
        to_pubkey,
        lamports,
    )
}

#[wasm_bindgen]
pub fn allocate(pubkey: &Pubkey, space: u64) -> Instruction {
    solana_system_interface::instruction::allocate(pubkey, space)
}

#[wasm_bindgen]
pub fn allocateWithSeed(
    address: &Pubkey,
    base: &Pubkey,
    seed: &str,
    space: u64,
    owner: &Pubkey,
) -> Instruction {
    allocate_with_seed(address, base, seed, space, owner)
}

#[wasm_bindgen]
pub fn createNonceAccount(
    from_pubkey: &Pubkey,
    nonce_pubkey: &Pubkey,
    authority: &Pubkey,
    lamports: u64,
) -> js_sys::Array {
    let instructions = create_nonce_account(from_pubkey, nonce_pubkey, authority, lamports);
    instructions.into_iter().map(JsValue::from).collect()
}

#[wasm_bindgen]
pub fn advanceNonceAccount(nonce_pubkey: &Pubkey, authorized_pubkey: &Pubkey) -> Instruction {
    advance_nonce_account(nonce_pubkey, authorized_pubkey)
}

#[wasm_bindgen]
pub fn withdrawNonceAccount(
    nonce_pubkey: &Pubkey,
    authorized_pubkey: &Pubkey,
    to_pubkey: &Pubkey,
    lamports: u64,
) -> Instruction {
    withdraw_nonce_account(nonce_pubkey, authorized_pubkey, to_pubkey, lamports)
}

#[wasm_bindgen]
pub fn authorizeNonceAccount(
    nonce_pubkey: &Pubkey,
    authorized_pubkey: &Pubkey,
    new_authority: &Pubkey,
) -> Instruction {
    authorize_nonce_account(nonce_pubkey, authorized_pubkey, new_authority)
}
