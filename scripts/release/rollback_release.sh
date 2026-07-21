#!/usr/bin/env bash
set -euo pipefail

PREVIOUS_MANIFEST="${1:?usage: rollback_release.sh <previous-release-manifest.json>}"
CURRENT_MANIFEST="${2:?usage: rollback_release.sh <previous-manifest> <current-manifest>}"

COMPATIBILITY="$(jq -r .migration_compatibility "$CURRENT_MANIFEST")"
if [ "$COMPATIBILITY" = "incompatible_without_restore" ]; then
  echo "Rollback blocked: restore a validated backup explicitly before using prior images." >&2
  exit 1
fi

echo "Rollback is permitted by migration policy: $COMPATIBILITY"
echo "Set BACKEND_IMAGE and FRONTEND_IMAGE to the exact digests in $PREVIOUS_MANIFEST."
echo "No downgrade, restore, or runtime mutation was executed."
