from app.database import SessionLocal
from app.modules.auth.service import seed_default_users


def main() -> None:
    with SessionLocal() as db:
        seed_default_users(db)


if __name__ == "__main__":
    main()
