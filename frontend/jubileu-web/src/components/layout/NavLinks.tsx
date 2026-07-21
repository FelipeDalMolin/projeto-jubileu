import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type Props = {
  isActive: (path: string) => boolean;
};

export default function NavLinks({ isActive }: Props) {
  const linkClass = (active: boolean) =>
    cn(
      "rounded-md px-2.5 py-1.5 text-sm font-medium no-underline transition hover:bg-slate-100 hover:no-underline",
      active ? "bg-primary/10 text-primary" : "text-slate-600",
    );

  return (
    <nav className="flex flex-wrap gap-1">
      <Link to="/dias" data-testid="nav-calendario" className={linkClass(isActive("/dias"))}>
        Calendario
      </Link>
      <Link to="/turmas" data-testid="nav-turmas" className={linkClass(isActive("/turmas"))}>
        Turmas
      </Link>
      <Link to="/jogadores" data-testid="nav-jogadores" className={linkClass(isActive("/jogadores"))}>
        Jogadores
      </Link>
      <Link to="/dashboard" data-testid="nav-dashboard" className={linkClass(isActive("/dashboard"))}>
        Dashboards
      </Link>
      <Link to="/usuario" data-testid="nav-sessao" className={linkClass(isActive("/usuario"))}>
        Sessao
      </Link>
    </nav>
  );
}
