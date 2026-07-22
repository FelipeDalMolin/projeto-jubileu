#!/usr/bin/env python3
"""Render the tested API authorization registry as auditable documentation."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend" / "jubileu-api-fastapi"
OUTPUT = ROOT / "docs" / "generated" / "authorization-matrix.md"
sys.path.insert(0, str(BACKEND))

from app.modules.auth.policy import AccessPolicy, ROUTE_POLICY  # noqa: E402

LABELS = {
    AccessPolicy.PUBLIC: ("Anonimo", "Somente refresh exige CSRF proprio"),
    AccessPolicy.AUTHENTICATED_READ: ("admin, treinador, auxiliar, user", "Nao"),
    AccessPolicy.SELF_SERVICE: ("admin, treinador, auxiliar, user; somente identidade propria", "Cookie: sim; Bearer: nao"),
    AccessPolicy.OPERATOR: ("admin, treinador, auxiliar", "Cookie: sim; Bearer: nao"),
}


def render() -> str:
    rows = []
    for (method, path), policy in sorted(ROUTE_POLICY.items(), key=lambda item: (item[0][1], item[0][0])):
        roles, csrf = LABELS[policy]
        rows.append(f"| `{method}` | `{path}` | `{policy.value}` | {roles} | {csrf} |")

    return "\n".join(
        [
            "# Matriz de autorizacao HTTP",
            "",
            "> Gerado por `python3 scripts/docs/generate_authorization_matrix.py` a partir de",
            "> `backend/jubileu-api-fastapi/app/modules/auth/policy.py`. Nao editar manualmente.",
            "",
            "| Metodo | Path | Politica | Papeis | CSRF |",
            "|---|---|---|---|---|",
            *rows,
            "",
            "Regras: leituras exigem autenticacao; comandos `operator` exigem `admin`, `treinador` ou",
            "`auxiliar`; comandos `self_service` resolvem exclusivamente o vinculo persistido do usuario.",
            "Headers `X-User-*` sao aceitos apenas em development/test e nunca prevalecem sobre cookie ou Bearer.",
            "",
        ]
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = render()

    if args.check:
        current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if current != content:
            print(f"{OUTPUT.relative_to(ROOT)} is out of date", file=sys.stderr)
            raise SystemExit(1)
        print(f"{OUTPUT.relative_to(ROOT)} is up to date.")
        return

    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Generated {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
