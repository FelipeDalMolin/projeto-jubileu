import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header
      style={{
        background: "#e2e8f0",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <strong>🏆 Jubileu</strong>

        <nav style={{ display: "flex", gap: 12 }}>
          <Link
            to="/dias"
            style={{
              textDecoration: isActive("/dias") ? "underline" : "none",
            }}
          >
            Dias de Jogo
          </Link>
          <Link
            to="/jogadores"
            style={{
              textDecoration: isActive("/jogadores") ? "underline" : "none",
            }}
          >
            Jogadores
          </Link>
          <Link
            to="/dashboards"
            style={{
              textDecoration: isActive("/dashboards") ? "underline" : "none",
            }}
          >
            Dashboards
          </Link>
        </nav>
      </div>

      <Link to="/login">
        <button>Entrar</button>
      </Link>
    </header>
  );
}
