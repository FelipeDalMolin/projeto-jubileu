from sqlalchemy import create_engine, text

URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/jubileu_dev"

engine = create_engine(URL)

with engine.connect() as conn:
    print("DB / Schema:")
    print(conn.execute(text(
        "select current_database(), current_schema()"
    )).fetchone())

    print("\nColunas da tabela aulas:")
    rows = conn.execute(text("""
        select ordinal_position, column_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'aulas'
        order by ordinal_position
    """)).fetchall()

    for r in rows:
        print(r)
