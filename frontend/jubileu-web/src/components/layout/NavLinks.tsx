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
      <Link to="/dias" data-testid="nav-calendario" style={linkStyle(isActive("/dias"))}>
        Calendario
      </Link>
      <Link to="/turmas" data-testid="nav-turmas" style={linkStyle(isActive("/turmas"))}>
        Turmas
      </Link>
      <Link to="/jogadores" data-testid="nav-jogadores" style={linkStyle(isActive("/jogadores"))}>
        Jogadores
      </Link>
      <Link to="/dashboard" data-testid="nav-dashboard" style={linkStyle(isActive("/dashboard"))}>
        Dashboards
      </Link>
      <Link to="/usuario" data-testid="nav-sessao" style={linkStyle(isActive("/usuario"))}>
        Sessao
      </Link>
    </nav>
  );
}
