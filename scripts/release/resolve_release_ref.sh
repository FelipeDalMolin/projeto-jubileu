#!/usr/bin/env bash
set -euo pipefail

RELEASE_REF="${1:?usage: resolve_release_ref.sh <tag-or-sha>}"
git fetch origin jubileu-v2 --tags --prune
RELEASE_SHA="$(git rev-parse --verify "${RELEASE_REF}^{commit}")"

if ! git merge-base --is-ancestor "$RELEASE_SHA" origin/jubileu-v2; then
  echo "Release ref $RELEASE_REF ($RELEASE_SHA) is not in origin/jubileu-v2 history." >&2
  exit 1
fi

printf '%s\n' "$RELEASE_SHA"
