import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
};

export function PageShell({ children, className, "data-testid": testId }: PageShellProps) {
  return (
    <main
      data-testid={testId}
      className={cn("mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8", className)}
    >
      {children}
    </main>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-normal text-slate-500">{eyebrow}</p>
        ) : null}
        <h1 className="truncate text-2xl font-semibold text-slate-950">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
