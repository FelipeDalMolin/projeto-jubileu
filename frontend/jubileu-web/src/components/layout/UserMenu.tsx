import { Link } from "react-router-dom";
import { useAuthSession } from "../../hooks/useAuthSession";

export default function UserMenu() {
  const { user, logout } = useAuthSession();

  if (!user) {
    return (
      <Link to="/login">
        <button type="button">Entrar</button>
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <small style={{ opacity: 0.9 }}>
        {user.displayName} [{user.role}]
      </small>
      <button type="button" onClick={logout}>
        Sair
      </button>
    </div>
  );
}
