import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function ResponsiveTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-slate-200", className)}>
      <table className="w-full min-w-[620px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">{children}</thead>;
}

export function TableRow({ children, className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-slate-100 last:border-0", className)} {...props}>{children}</tr>;
}

export function TableHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2", className)}>{children}</th>;
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 align-middle text-slate-700", className)}>{children}</td>;
}
