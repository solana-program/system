//! Solana System Program.

#[cfg(all(target_os = "solana", feature = "bpf-entrypoint"))]
pub mod entrypoint;
pub mod processor;
