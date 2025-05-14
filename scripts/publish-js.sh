#!/usr/bin/env bash

set -euo pipefail

library_path="${1:-}"
level="${2:-}"
tag="${3:-latest}"
dry_run="${DRY_RUN:-false}"

if [[ -z "$library_path" || -z "$level" ]]; then
    echo "Usage: $0 <library_path> <version-level> [tag]"
    echo "Example: $0 clients/js patch beta"
    exit 1
fi

cd "$library_path"
pnpm install

# Build version args
version_args=(--no-git-tag-version)
if [[ "$level" == pre* ]]; then
    version_args+=(--preid "$tag")
fi

# Bump version and capture new version
new_version=$(pnpm version "$level" "${version_args[@]}" | tail -n1 | sed 's/^v//;s/\r$//')

# CI output
if [[ -n "${CI:-}" ]]; then
    echo "new_version=${new_version}" >> "$GITHUB_OUTPUT"
fi

# Publish package
pnpm publish --no-git-checks --tag "$tag"

# Git commit and tag
git commit -am "Publish JS client v${new_version}"
git tag -a "js@v${new_version}" -m "JS client v${new_version}"
