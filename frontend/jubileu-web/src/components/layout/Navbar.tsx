import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

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
            Dias de Jogo
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

      {/* Lado direito: sessão do usuário */}
      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right", fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>{user.name}</div>
            <Link to="/usuario" style={{ color: "#bae6fd" }}>
              Ver perfil
            </Link>
          </div>
          <button
            onClick={logout}
            style={{
              background: "#ef4444",
              borderColor: "#fca5a5",
              color: "#0f172a",
            }}
          >
            Sair
          </button>
        </div>
      ) : (
        <Link to="/login" style={{ color: "inherit" }}>
          <button style={{ background: "#38bdf8", color: "#0f172a" }}>
            Entrar
          </button>
        </Link>
      )}
    </header>
  );
}
