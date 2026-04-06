import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "danger";
type Size = "default" | "sm";

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
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
