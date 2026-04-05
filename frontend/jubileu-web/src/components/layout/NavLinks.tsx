import { Link } from "react-router-dom";

type Props = {
  isActive: (path: string) => boolean;
};

function linkStyle(active: boolean) {
  return {
    textDecoration: active ? "underline" : "none",
    textUnderlineOffset: 6,
  };
}

export default function NavLinks({ isActive }: Props) {
  return (
    <nav style={{ display: "flex", gap: 14 }}>
      <Link to="/dias" style={linkStyle(isActive("/dias"))}>
        Calendario
      </Link>
      <Link to="/turmas" style={linkStyle(isActive("/turmas"))}>
        Turmas
      </Link>
      <Link to="/jogadores" style={linkStyle(isActive("/jogadores"))}>
        Jogadores
      </Link>
      <Link to="/dashboard" style={linkStyle(isActive("/dashboard"))}>
        Dashboards
      </Link>
      <Link to="/usuario" style={linkStyle(isActive("/usuario"))}>
        Sessao
      </Link>
    </nav>
  );
}
