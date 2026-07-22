#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="${GITHUB_REPOSITORY:-FelipeDalMolin/projeto-jubileu}"
GIT_SHA="${1:?usage: verify_required_checks.sh <full-git-sha> [output.json]}"
OUTPUT_FILE="${2:-required-checks.json}"

if [[ ! "$GIT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "A full 40-character Git SHA is required." >&2
  exit 1
fi

required='["Docs sync","Backend unit","PostgreSQL + Alembic","Frontend","Playwright operational","Compose + Shell"]'
response="$(gh api -H 'Accept: application/vnd.github+json' \
  "/repos/$REPOSITORY/commits/$GIT_SHA/check-runs?per_page=100")"

jq --argjson required "$required" --arg git_sha "$GIT_SHA" '
  .check_runs as $runs
  | {
      git_sha: $git_sha,
      verified_at: (now | todateiso8601),
      checks: [
        $required[] as $name
        | ([$runs[] | select(.name == $name)] | sort_by(.started_at) | last) as $run
        | {
            name: $name,
            status: ($run.status // "missing"),
            conclusion: ($run.conclusion // "missing"),
            details_url: ($run.details_url // null)
          }
      ]
    }
' <<<"$response" >"$OUTPUT_FILE"

if ! jq -e '.checks | length == 6 and all(.status == "completed" and .conclusion == "success")' \
  "$OUTPUT_FILE" >/dev/null; then
  jq . "$OUTPUT_FILE" >&2
  echo "The six required checks are not green on $GIT_SHA." >&2
  exit 1
fi

echo "Required checks verified on $GIT_SHA; evidence: $OUTPUT_FILE"
