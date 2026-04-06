import type * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "secondary" | "success" | "warning" | "danger" | "outline";

const variantClasses: Record<Variant, string> = {
  default: "bg-primary text-white",
  secondary: "bg-slate-700 text-white",
  success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border border-amber-200",
  danger: "bg-red-100 text-red-700 border border-red-200",
  outline: "border border-border bg-white text-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
