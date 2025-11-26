// src/components/layout/Navbar.tsx
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header
      style={{
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "4px solid #38bdf8",
      }}
    >
      {/* Lado esquerdo: logo + menu */}
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <Link to="/dias" style={{ color: "inherit", fontWeight: 700 }}>
          🏆 Jubileu
        </Link>

        <nav style={{ display: "flex", gap: 14 }}>
          <Link
            to="/dias"
            style={{
              textDecoration: isActive("/dias") ? "underline" : "none",
              textUnderlineOffset: 6,
            }}
          >
            Calendário
          </Link>

          <Link
            to="/turmas"
            style={{
              textDecoration: isActive("/turmas") ? "underline" : "none",
              textUnderlineOffset: 6,
            }}
          >
            Turmas
          </Link>

          <Link
            to="/jogadores"
            style={{
              textDecoration: isActive("/jogadores") ? "underline" : "none",
              textUnderlineOffset: 6,
            }}
          >
            Jogadores
          </Link>

          <Link
            to="/dashboards"
            style={{
              textDecoration: isActive("/dashboards") ? "underline" : "none",
              textUnderlineOffset: 6,
            }}
          >
            Dashboards
          </Link>
        </nav>
      </div>

      {/* Lado direito: botão de login (por enquanto) */}
      <Link to="/login">
        <button>Entrar</button>
      </Link>
    </header>
  );
}
