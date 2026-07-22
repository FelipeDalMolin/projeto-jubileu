#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MANIFEST="${1:?usage: build_release_bundle.sh <release-manifest.json> [output-dir]}"
OUTPUT_DIR="${2:-$ROOT_DIR/release-bundles}"

if [ ! -f "$MANIFEST" ]; then
  echo "Manifest not found: $MANIFEST" >&2
  exit 1
fi

jq -e '
  (.git_sha | test("^[0-9a-f]{40}$")) and
  (.backend_image | test("@sha256:[0-9a-f]{64}$")) and
  (.frontend_image | test("@sha256:[0-9a-f]{64}$")) and
  (.alembic_head | length > 0) and
  (.checks | type == "array" and length == 6)
' "$MANIFEST" >/dev/null

release_ref="$(jq -r .release_ref "$MANIFEST")"
safe_ref="$(printf '%s' "$release_ref" | tr -c 'A-Za-z0-9._-' '-')"
stage_dir="$(mktemp -d)"
bundle_root="$stage_dir/jubileu-$safe_ref"
archive="$OUTPUT_DIR/jubileu-$safe_ref.tar.gz"
trap 'rm -rf "$stage_dir"' EXIT

mkdir -p "$bundle_root/scripts/release" "$bundle_root/docs/runbooks" "$bundle_root/docs/current" "$OUTPUT_DIR"
install -m 600 "$MANIFEST" "$bundle_root/release-manifest.json"
install -m 600 "$ROOT_DIR/compose.release.yml" "$bundle_root/compose.release.yml"
install -m 600 "$ROOT_DIR/.env.release.example" "$bundle_root/.env.release.example"
install -m 700 "$ROOT_DIR"/scripts/release/*.sh "$bundle_root/scripts/release/"
install -m 600 "$ROOT_DIR/docs/runbooks/release-v03.md" "$bundle_root/docs/runbooks/release-v03.md"
install -m 600 "$ROOT_DIR/docs/current/INFRASTRUCTURE.md" "$bundle_root/docs/current/INFRASTRUCTURE.md"
install -m 600 "$ROOT_DIR/docs/current/RELEASES.md" "$bundle_root/docs/current/RELEASES.md"

if find "$bundle_root" -type f \( -name '.env.release' -o -name '*.dump' -o -name '*.sql' \) | grep -q .; then
  echo "Secret-bearing or database files are forbidden in the release bundle." >&2
  exit 1
fi

(
  cd "$bundle_root"
  find . -type f -print0 | sort -z | xargs -0 sha256sum >"$stage_dir/SHA256SUMS"
  mv "$stage_dir/SHA256SUMS" SHA256SUMS
  sha256sum --check SHA256SUMS >/dev/null
)

tar -C "$stage_dir" -czf "$archive" "$(basename "$bundle_root")"
sha256sum "$archive" >"$archive.sha256"
echo "$archive"
