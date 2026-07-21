import type * as React from "react";
import { cn } from "../../lib/utils";
import { Input } from "./input";

type FieldProps = React.ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ label, hint, error, id, className, ...props }: FieldProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={inputId}>
      {label}
      <Input id={inputId} className={cn("mt-1", className)} aria-invalid={Boolean(error)} {...props} />
      {hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}

type SelectFieldProps = React.ComponentProps<"select"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function SelectField({ label, hint, error, id, className, children, ...props }: SelectFieldProps) {
  const selectId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={selectId}>
      {label}
      <select
        id={selectId}
        className={cn(
          "mt-1 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      {hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}
