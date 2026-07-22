#!/usr/bin/env python3
"""Reject integration tests that create or drop the database schema via ORM."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TESTS = ROOT / "backend" / "jubileu-api-fastapi" / "tests"
MARKERS = ("pytest.mark.integration", "pytestmark = pytest.mark.integration")
FORBIDDEN = ("metadata.create_all", "metadata.drop_all")


def main() -> int:
    violations: list[str] = []
    checked = 0
    for path in sorted(TESTS.glob("test_*.py")):
        source = path.read_text(encoding="utf-8")
        if not any(marker in source for marker in MARKERS):
            continue
        checked += 1
        for token in FORBIDDEN:
            if token in source:
                violations.append(f"{path.relative_to(ROOT)}: forbidden {token}")

    if checked == 0:
        raise SystemExit("No integration test modules were found.")
    if violations:
        raise SystemExit("\n".join(violations))
    print(f"Integration DB boundary OK: {checked} module(s) use Alembic-managed schemas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
