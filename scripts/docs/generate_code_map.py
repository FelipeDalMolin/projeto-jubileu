#!/usr/bin/env python3
"""Generate a code-derived documentation map for Projeto Jubileu.

The script intentionally uses only the Python standard library so it can run
before the backend virtualenv exists.
"""

from __future__ import annotations

import argparse
import ast
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "docs" / "generated" / "code-map.md"


@dataclass(frozen=True)
class FieldInfo:
    name: str
    foreign_key: str | None = None


@dataclass(frozen=True)
class RelationshipInfo:
    name: str
    target: str
    back_populates: str | None = None


@dataclass(frozen=True)
class ModelInfo:
    name: str
    table: str
    source: Path
    fields: list[FieldInfo] = field(default_factory=list)
    relationships: list[RelationshipInfo] = field(default_factory=list)


@dataclass(frozen=True)
class RouteInfo:
    method: str
    path: str
    source: Path
    function: str


@dataclass(frozen=True)
class FrontendRouteInfo:
    path: str
    component: str
    source: Path


@dataclass(frozen=True)
class ApiCallInfo:
    method_hint: str
    path: str
    source: Path
    line: int


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def md_cell(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ")


def literal(node: ast.AST | None) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.JoinedStr):
        return "".join(
            part.value if isinstance(part, ast.Constant) and isinstance(part.value, str) else "{expr}"
            for part in node.values
        )
    return None


def call_name(node: ast.AST | None) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return ""


def is_call(node: ast.AST | None, name: str) -> bool:
    return isinstance(node, ast.Call) and call_name(node.func) == name


def find_foreign_key(node: ast.AST) -> str | None:
    for child in ast.walk(node):
        if is_call(child, "ForeignKey"):
            call = child
            if call.args:
                return literal(call.args[0])
    return None


def keyword_value(call: ast.Call, name: str) -> str | None:
    for keyword in call.keywords:
        if keyword.arg == name:
            return literal(keyword.value)
    return None


def extract_models() -> list[ModelInfo]:
    models: list[ModelInfo] = []
    models_dir = ROOT / "backend" / "jubileu-api-fastapi" / "app" / "models"

    for source in sorted(models_dir.glob("*.py")):
        tree = ast.parse(source.read_text(encoding="utf-8"), filename=str(source))
        for class_node in [n for n in tree.body if isinstance(n, ast.ClassDef)]:
            table: str | None = None
            fields: list[FieldInfo] = []
            relationships: list[RelationshipInfo] = []

            for item in class_node.body:
                if isinstance(item, ast.Assign):
                    for target in item.targets:
                        if isinstance(target, ast.Name) and target.id == "__tablename__":
                            table = literal(item.value)

                if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    attr_name = item.target.id
                    value = item.value
                    if is_call(value, "mapped_column"):
                        fields.append(FieldInfo(attr_name, find_foreign_key(value)))
                    if is_call(value, "relationship"):
                        target = literal(value.args[0]) if value.args else None
                        relationships.append(
                            RelationshipInfo(
                                attr_name,
                                target or "?",
                                keyword_value(value, "back_populates"),
                            )
                        )

            if table:
                models.append(
                    ModelInfo(
                        name=class_node.name,
                        table=table,
                        source=source,
                        fields=fields,
                        relationships=relationships,
                    )
                )

    return models


def router_prefix(tree: ast.Module) -> str:
    for node in tree.body:
        if not isinstance(node, ast.Assign) or not is_call(node.value, "APIRouter"):
            continue
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id == "router":
                return keyword_value(node.value, "prefix") or ""
    return ""


def iter_router_files() -> Iterable[Path]:
    app_dir = ROOT / "backend" / "jubileu-api-fastapi" / "app"
    yield from sorted((app_dir / "routers").glob("*.py"))
    yield from sorted((app_dir / "modules" / "auth").glob("routes.py"))
    yield from sorted((app_dir / "api" / "dashboards").glob("*.py"))


def join_paths(*parts: str) -> str:
    raw = "/".join(part.strip("/") for part in parts if part != "")
    return "/" + raw if raw else "/"


def extract_router_routes() -> dict[str, list[RouteInfo]]:
    routes_by_source: dict[str, list[RouteInfo]] = {}

    for source in iter_router_files():
        tree = ast.parse(source.read_text(encoding="utf-8"), filename=str(source))
        prefix = router_prefix(tree)
        routes: list[RouteInfo] = []

        for node in ast.walk(tree):
            if not isinstance(node, ast.FunctionDef):
                continue
            for decorator in node.decorator_list:
                if not isinstance(decorator, ast.Call):
                    continue
                if not isinstance(decorator.func, ast.Attribute):
                    continue
                if not isinstance(decorator.func.value, ast.Name):
                    continue
                if decorator.func.value.id != "router":
                    continue
                method = decorator.func.attr.upper()
                if method not in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                    continue
                path = literal(decorator.args[0]) if decorator.args else ""
                routes.append(RouteInfo(method, join_paths(prefix, path or ""), source, node.name))

        routes_by_source[rel(source)] = routes

    return routes_by_source


def main_router_var_by_source() -> dict[str, str]:
    return {
        "backend/jubileu-api-fastapi/app/routers/jogadores.py": "jogadores",
        "backend/jubileu-api-fastapi/app/routers/dias.py": "dias",
        "backend/jubileu-api-fastapi/app/routers/turmas.py": "turmas",
        "backend/jubileu-api-fastapi/app/routers/partidas.py": "partidas",
        "backend/jubileu-api-fastapi/app/routers/eventos.py": "eventos",
        "backend/jubileu-api-fastapi/app/routers/usuarios.py": "usuarios",
        "backend/jubileu-api-fastapi/app/modules/auth/routes.py": "auth_routes",
        "backend/jubileu-api-fastapi/app/api/dashboards/jogadores.py": "dashboards_jogadores",
        "backend/jubileu-api-fastapi/app/api/dashboards/partidas.py": "dashboards_partidas",
        "backend/jubileu-api-fastapi/app/api/dashboards/estatisticas.py": "dashboards_estatisticas",
    }


def extract_app_include_prefixes() -> dict[str, list[str]]:
    main_py = ROOT / "backend" / "jubileu-api-fastapi" / "app" / "main.py"
    content = main_py.read_text(encoding="utf-8")
    result: dict[str, list[str]] = {}
    pattern = re.compile(r"app\.include_router\((\w+)\.router(?:,\s*prefix=\"([^\"]+)\")?\)")
    for match in pattern.finditer(content):
        var_name = match.group(1)
        prefix = match.group(2) or ""
        result.setdefault(var_name, []).append(prefix)
    return result


def effective_routes() -> list[RouteInfo]:
    declared = extract_router_routes()
    includes = extract_app_include_prefixes()
    var_by_source = main_router_var_by_source()
    routes: list[RouteInfo] = []

    for source, source_routes in declared.items():
        var_name = var_by_source.get(source)
        include_prefixes = includes.get(var_name or "", [""])
        for route in source_routes:
            for include_prefix in include_prefixes:
                routes.append(
                    RouteInfo(
                        method=route.method,
                        path=join_paths(include_prefix, route.path),
                        source=route.source,
                        function=route.function,
                    )
                )

    return sorted(routes, key=lambda r: (r.path, r.method, rel(r.source), r.function))


def extract_frontend_routes() -> list[FrontendRouteInfo]:
    source = ROOT / "frontend" / "jubileu-web" / "src" / "routes" / "AppRoutes.tsx"
    content = source.read_text(encoding="utf-8")
    routes: list[FrontendRouteInfo] = []
    for match in re.finditer(r'<Route\s+path="([^"]+)"\s+element=\{<([A-Za-z0-9_]+)', content):
        routes.append(FrontendRouteInfo(match.group(1), match.group(2), source))
    return routes


def normalize_template_path(path: str) -> str:
    for dynamic_query in ("${query ? ", "${qs ? "):
        if dynamic_query in path:
            path = path.split(dynamic_query, 1)[0] + "{query}"
    path = re.sub(r"\$\{([^}]+)\}", lambda m: "{" + m.group(1).strip().split(".")[-1] + "}", path)
    path = path.replace("{expr}", "{expr}")
    return path


def api_method_hint(function_name: str, line: str) -> str:
    by_name = {
        "cachedDashboardJson": "GET",
        "getJson": "GET",
        "fetchJson": "GET",
        "apiJson": "GET",
        "postJson": "POST",
        "deleteJson": "DELETE",
        "patchJson": "PATCH",
        "apiFetch": "FETCH",
        "requestJson": "FETCH",
        "fetch": "FETCH",
        "buildUrl": "URL",
        "url": "URL",
    }
    if function_name == "fetch":
        method_match = re.search(r'method:\s*"([A-Z]+)"', line)
        if method_match:
            return method_match.group(1)
    return by_name.get(function_name, "API")


def extract_frontend_api_calls() -> list[ApiCallInfo]:
    src = ROOT / "frontend" / "jubileu-web" / "src"
    files = sorted([*src.glob("services/**/*.ts"), *src.glob("services/**/*.tsx"), *src.glob("lib/**/*.ts")])
    calls: list[ApiCallInfo] = []
    pattern = re.compile(
        r"\b(fetch|buildUrl|url|requestJson|fetchJson|getJson|postJson|deleteJson|patchJson|apiFetch|apiJson|cachedDashboardJson)\s*"
        r"(?:<[^>]+>)?\s*\(\s*([`'\"])((?:/api)?/dashboards/.*?|/api/.*?)(?:\2|`)",
        re.DOTALL,
    )

    for source in files:
        content = source.read_text(encoding="utf-8")
        for match in pattern.finditer(content):
            line_no = content.count("\n", 0, match.start()) + 1
            line = content.splitlines()[line_no - 1] if content.splitlines() else ""
            path = normalize_template_path(match.group(3))
            if match.group(1) == "cachedDashboardJson" and not path.startswith("/api/"):
                path = f"/api{path}"
            calls.append(
                ApiCallInfo(
                    method_hint=api_method_hint(match.group(1), line),
                    path=path,
                    source=source,
                    line=line_no,
                )
            )

    return sorted(calls, key=lambda c: (c.path, c.method_hint, rel(c.source), c.line))


def mermaid_er(models: list[ModelInfo]) -> list[str]:
    lines = ["```mermaid", "erDiagram"]

    for model in sorted(models, key=lambda m: m.table):
        lines.append(f"  {model.table} {{")
        lines.append("    string id")
        lines.append("  }")

    for model in sorted(models, key=lambda m: m.table):
        for field_info in model.fields:
            if not field_info.foreign_key or "." not in field_info.foreign_key:
                continue
            target_table = field_info.foreign_key.split(".", 1)[0]
            lines.append(f"  {target_table} ||--o{{ {model.table} : \"{field_info.name}\"")

    lines.append("```")
    return lines


def render() -> str:
    models = extract_models()
    routes = effective_routes()
    frontend_routes = extract_frontend_routes()
    api_calls = extract_frontend_api_calls()

    lines: list[str] = [
        "# Code Map",
        "",
        "Arquivo gerado por `python3 scripts/docs/generate_code_map.py`.",
        "Nao edite manualmente; atualize o codigo ou os docs vivos e gere novamente.",
        "",
        "## Dominio Persistido",
        "",
        "| Classe | Tabela | FKs |",
        "|---|---|---|",
    ]

    for model in sorted(models, key=lambda m: m.table):
        fks = [f"{field_info.name} -> {field_info.foreign_key}" for field_info in model.fields if field_info.foreign_key]
        lines.append(f"| `{model.name}` | `{model.table}` | {md_cell(', '.join(fks)) if fks else '-'} |")

    lines.extend(["", "## Relacionamentos ORM", "", "| Classe | Relacionamentos |", "|---|---|"])
    for model in sorted(models, key=lambda m: m.table):
        relationships = [
            f"`{relationship.name}` -> `{relationship.target}`"
            + (f" (`back_populates={relationship.back_populates}`)" if relationship.back_populates else "")
            for relationship in model.relationships
        ]
        lines.append(f"| `{model.name}` | {md_cell('; '.join(relationships)) if relationships else '-'} |")

    lines.extend(["", "## ERD Gerado", "", *mermaid_er(models)])

    api_routes = sorted({(route.method, route.path) for route in routes if route.path.startswith("/api/")})
    internal_routes = sorted({(route.method, route.path) for route in routes if not route.path.startswith("/api/")})

    lines.extend(["", "## Rotas Backend Efetivas", "", "### Publicas `/api`", "", "| Metodo | Path |", "|---|---|"])
    for method, path in api_routes:
        lines.append(f"| `{method}` | `{md_cell(path)}` |")

    lines.extend(["", "### Internas/Compatibilidade", "", "| Metodo | Path |", "|---|---|"])
    for method, path in internal_routes:
        lines.append(f"| `{method}` | `{md_cell(path)}` |")

    lines.extend(["", "## Rotas Frontend", "", "| Path | Componente |", "|---|---|"])
    for route in frontend_routes:
        lines.append(f"| `{md_cell(route.path)}` | `{route.component}` |")

    lines.extend(["", "## Chamadas API No Frontend", "", "| Hint | Path |", "|---|---|"])
    seen_calls: set[tuple[str, str]] = set()
    for call in api_calls:
        key = (call.method_hint, call.path)
        if key in seen_calls:
            continue
        seen_calls.add(key)
        lines.append(f"| `{call.method_hint}` | `{md_cell(call.path)}` |")

    lines.extend(
        [
            "",
            "## Leitura Arquitetural",
            "",
            "- `Evento` e a entidade persistida central; `AULA` aparece como valor de `Evento.tipo`.",
            "- Rotas sem `/api` ainda existem por compatibilidade/localidade do app FastAPI, mas o frontend deve chamar `/api/...`.",
            "- `TeamConfig` e `EventoEquipesEstado` representam snapshots/versionamento de composicao de equipes.",
            "- `EventoParticipante` registra RSVP/check-in; `JogadorEvento` preserva snapshot operacional do jogador no evento.",
            "- `Lance` e `EstatisticaJogadorPartida` materializam eventos de jogo e estatisticas por partida.",
        ]
    )

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate docs/generated/code-map.md from code.")
    parser.add_argument("--check", action="store_true", help="Fail if generated output is not up to date.")
    args = parser.parse_args()

    rendered = render()

    if args.check:
        existing = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if existing != rendered:
            print(f"{rel(OUTPUT)} is out of date. Run: python3 scripts/docs/generate_code_map.py", file=sys.stderr)
            return 1
        print(f"{rel(OUTPUT)} is up to date.")
        return 0

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(rendered, encoding="utf-8")
    print(f"Generated {rel(OUTPUT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
