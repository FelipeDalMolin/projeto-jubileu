import { cn } from "../../lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "danger";
type Size = "default" | "sm" | "xs";

const variantClasses: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  outline: "border border-border bg-white text-foreground hover:bg-slate-50",
  ghost: "bg-transparent text-foreground hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<Size, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  xs: "h-7 px-2.5 text-xs",
};

export type ButtonVariant = Variant;
export type ButtonSize = Size;

export function buttonClasses({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-md font-medium transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}
