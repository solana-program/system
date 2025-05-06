include vars.env

nightly = +$(subst ",,${RUST_TOOLCHAIN_NIGHTLY})

clippy-%:
	cargo $(nightly) clippy --manifest-path $(subst -,/,$*)/Cargo.toml

format-%:
	cargo $(nightly) fmt --check --manifest-path $(subst -,/,$*)/Cargo.toml

format-%-fix:
	cargo $(nightly) fmt --manifest-path $(subst -,/,$*)/Cargo.toml

features-%:
	cargo $(nightly) hack check --feature-powerset --all-targets --manifest-path $(subst -,/,$*)/Cargo.toml

publish-%:
	./scripts/publish-rust.sh $(subst -,/,$*)

build-wasm-interface:
	wasm-pack build --target nodejs --dev ./interface --features bincode

lint-docs-%:
	RUSTDOCFLAGS="--cfg docsrs -D warnings" cargo $(nightly) doc --all-features --no-deps --manifest-path $(subst -,/,$*)/Cargo.toml

lint-features-%:
	cargo $(nightly) hack check --feature-powerset --all-targets --manifest-path $(subst -,/,$*)/Cargo.toml

test-%:
	cargo $(nightly) test --manifest-path $(subst -,/,$*)/Cargo.toml

format-js:
	cd ./clients/js && pnpm install && pnpm format

lint-js:
	cd ./clients/js && pnpm install && pnpm lint

test-js:
	./scripts/restart-test-validator.sh
	cd ./clients/js && pnpm install && pnpm build && pnpm test
	./scripts/stop-test-validator.sh
