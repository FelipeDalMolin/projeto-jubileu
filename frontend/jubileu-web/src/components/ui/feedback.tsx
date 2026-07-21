import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-dashed border-slate-300 bg-slate-50 p-5 text-sm", className)}>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-slate-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Nao foi possivel concluir a acao",
  message,
  className,
}: {
  title?: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800", className)}
      role="alert"
    >
      <strong className="font-semibold">{title}</strong>
      <p className="mt-1">{message}</p>
    </div>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600" aria-live="polite">
      {label}
    </div>
  );
}
