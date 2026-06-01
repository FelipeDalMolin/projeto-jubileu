import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.main import app


def route_methods(route) -> str:
    methods = (getattr(route, "methods", None) or set()) - {"HEAD", "OPTIONS"}
    return ",".join(sorted(methods)) or "-"


def main() -> None:
    for route in sorted(app.routes, key=lambda item: getattr(item, "path", "")):
        print(f"{route_methods(route):18} {route.path}")


if __name__ == "__main__":
    main()
