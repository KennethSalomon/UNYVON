import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]": variant === "primary",
            "bg-lavender-soft text-primary-dark hover:bg-lavender/20": variant === "secondary",
            "bg-transparent text-text hover:bg-background": variant === "ghost",
            "border border-border bg-transparent text-text hover:bg-background": variant === "outline",
          },
          {
            "h-9 px-4 text-sm rounded-button": size === "sm",
            "h-11 px-6 text-sm rounded-button": size === "md",
            "h-13 px-8 text-base rounded-button": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
