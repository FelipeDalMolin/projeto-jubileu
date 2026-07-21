import * as React from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-classes";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={buttonClasses({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
