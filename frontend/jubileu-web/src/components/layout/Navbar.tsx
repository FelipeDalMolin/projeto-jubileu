import { Link, useLocation } from "react-router-dom";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";

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
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <Link to="/dias" style={{ color: "inherit", fontWeight: 700 }}>
          Jubileu Eventos
        </Link>
        <NavLinks isActive={isActive} />
      </div>
      <UserMenu />
    </header>
  );
}
