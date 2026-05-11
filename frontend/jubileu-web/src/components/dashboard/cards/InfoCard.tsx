import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../../lib/utils";

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  to?: string;
  onClick?: () => void;
};

const interactiveClasses =
  "transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function InfoCard({ title, value, subtitle, icon, to, onClick }: Props) {
  const content = (
    <div
      className={cn(
        "group flex h-full min-h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm",
        to || onClick ? interactiveClasses : "",
      )}
      role="article"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
            {icon}
          </div>
        ) : null}
      </div>
      {subtitle ? <p className="mt-4 text-sm leading-5 text-slate-600">{subtitle}</p> : null}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full rounded-lg focus-visible:outline-none" onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className="block h-full w-full rounded-lg text-left focus-visible:outline-none" onClick={onClick}>
        {content}
      </button>
    );
  }

  return content;
}
