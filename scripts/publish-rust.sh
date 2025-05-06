#!/usr/bin/env bash

set -euo pipefail

library_path="${1:-}"
level="${2:-}"
dry_run="${DRY_RUN:-false}"

if [[ -z "$library_path" || -z "$level" ]]; then
    echo "Usage: $0 <library_path> <version-level>"
    echo "Example: $0 clients/rust patch"
    exit 1
fi

cd "$library_path"

# Run cargo-release
if [[ "$dry_run" != "true" ]]; then
    cargo release "$level" --no-push --no-tag --no-confirm --execute
else
    cargo release "$level"
    exit 0
fi

# Extract crate name and version using cargo metadata
metadata=$(cargo metadata --no-deps --format-version 1)
crate_name=$(echo "$metadata" | jq -r '.packages[0].name')
new_version=$(echo "$metadata" | jq -r '.packages[0].version')

# CI output
if [[ -n "${CI:-}" ]]; then
    echo "new_version=${new_version}" >> "$GITHUB_OUTPUT"
fi

# Rebuild commit and tag
git reset --soft HEAD~1
git commit -am "Publish ${crate_name} v${new_version}"
git tag -a "${crate_name}@v${new_version}" -m "${crate_name} v${new_version}"
