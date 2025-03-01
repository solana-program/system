use mollusk_svm::Mollusk;

pub fn setup() -> Mollusk {
    Mollusk::new(
        &solana_system_interface::program::id(),
        "solana_system_program",
    )
}
