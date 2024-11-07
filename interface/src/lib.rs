//! The [system native program interface][np].
//!
//! [rent exempt]: https://solana.com/docs/core/accounts#rent-exemption
//!
//! The accounts created by the System program can either be user-controlled,
//! where the secret keys are held outside the blockchain,
//! or they can be [program derived addresses][pda],
//! where write access to accounts is granted by an owning program.
//!
//! [pda]: https://docs.rs/solana-pubkey/latest/solana_pubkey/struct.Pubkey.html#method.find_program_address
//!
//! Most of the functions in this module construct an [`Instruction`], that must
//! be submitted to the runtime for execution, either via RPC, typically with
//! [`RpcClient`], or through [cross-program invocation][cpi].
//!
//! When invoking through CPI, the [`invoke`] or [`invoke_signed`] instruction
//! requires all account references to be provided explicitly as [`AccountInfo`]
//! values. The account references required are specified in the documentation
//! for the [`SystemInstruction`] variants for each System program instruction,
//! and these variants are linked from the documentation for their constructors.
//!
//! [`RpcClient`]: https://docs.rs/solana-client/latest/solana_client/rpc_client/struct.RpcClient.html
//! [cpi]: https://docs.rs/solana-program/latest/solana_program/program/index.html
//! [`invoke`]: https://docs.rs/solana-program/latest/solana_program/program/fn.invoke.html
//! [`invoke_signed`]: https://docs.rs/solana-program/latest/solana_program/program/fn.invoke_signed.html
//! [`AccountInfo`]: https://docs.rs/solana-account-info/2.1.0/solana_account_info/struct.AccountInfo.html

#![cfg_attr(feature = "frozen-abi", feature(min_specialization))]
#![cfg_attr(docsrs, feature(doc_auto_cfg))]

pub mod error;
pub mod instruction;
#[cfg(target_arch = "wasm32")]
mod wasm;

use solana_pubkey::Pubkey;

// Inline some constants to avoid dependencies.
//
// Note: replace these inline IDs with the corresponding value from
// `solana_sdk_ids` once the version is updated to 2.2.0.

const RECENT_BLOCKHASHES_ID: Pubkey =
    Pubkey::from_str_const("SysvarRecentB1ockHashes11111111111111111111");

const RENT_ID: Pubkey = Pubkey::from_str_const("SysvarRent111111111111111111111111111111111");

#[cfg(test)]
static_assertions::const_assert_eq!(solana_nonce::state::State::size(), NONCE_STATE_SIZE);
/// The serialized size of the nonce state.
const NONCE_STATE_SIZE: usize = 80;

#[cfg(test)]
static_assertions::const_assert!(MAX_PERMITTED_DATA_LENGTH <= u32::MAX as u64);
/// Maximum permitted size of account data (10 MiB).
///
// SBF program entrypoint assumes that the max account data length
// will fit inside a u32. If this constant no longer fits in a u32,
// the entrypoint deserialization code in the SDK must be updated.
pub const MAX_PERMITTED_DATA_LENGTH: u64 = 10 * 1024 * 1024;

#[cfg(test)]
static_assertions::const_assert_eq!(MAX_PERMITTED_DATA_LENGTH, 10_485_760);
/// Maximum permitted size of new allocations per transaction, in bytes.
///
/// The value was chosen such that at least one max sized account could be created,
/// plus some additional resize allocations.
pub const MAX_PERMITTED_ACCOUNTS_DATA_ALLOCATIONS_PER_TRANSACTION: i64 =
    MAX_PERMITTED_DATA_LENGTH as i64 * 2;

pub mod program {
    use solana_pubkey::declare_id;

    declare_id!("11111111111111111111111111111111");
}
