import { Link, useLocation } from "react-router-dom";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";

export default function Navbar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Link
            to="/dias"
            className="text-base font-semibold text-slate-950 no-underline hover:no-underline"
          >
            Jubileu Eventos
          </Link>
          <NavLinks isActive={isActive} />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
