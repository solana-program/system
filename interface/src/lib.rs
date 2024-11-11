//! The System program interface.

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

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::sysvar::SysvarId;

    #[allow(deprecated)]
    #[test]
    fn test_constants() {
        // Ensure that the constants are in sync with the solana program.
        assert_eq!(
            RECENT_BLOCKHASHES_ID,
            solana_program::sysvar::recent_blockhashes::RecentBlockhashes::id(),
        );

        // Ensure that the constants are in sync with the solana rent.
        assert_eq!(RENT_ID, solana_program::sysvar::rent::Rent::id());
    }
}
