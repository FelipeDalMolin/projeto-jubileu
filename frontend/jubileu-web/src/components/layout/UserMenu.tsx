import { Link } from "react-router-dom";
import { useAuthSession } from "../../hooks/useAuthSession";
import { buttonClasses } from "../ui/button-classes";
import { Button } from "../ui/button";

export default function UserMenu() {
  const { user, logout } = useAuthSession();

  if (!user) {
    return (
      <Link to="/login" className={buttonClasses({ variant: "outline", size: "sm" })}>
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="max-w-[220px] truncate text-slate-600">
        {user.displayName} [{user.role}]
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={logout}>
        Sair
      </Button>
    </div>
  );
}
