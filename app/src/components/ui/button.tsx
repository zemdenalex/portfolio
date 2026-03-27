import {
  forwardRef,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-text-primary text-bg-primary hover:bg-text-secondary",
  outline:
    "border border-border bg-transparent text-text-primary hover:bg-bg-secondary",
  ghost:
    "bg-transparent text-text-primary hover:bg-bg-secondary",
  accent:
    "bg-accent text-white hover:bg-accent-hover",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
  children?: ReactNode;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild = false, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-md font-medium",
      "transition-colors duration-150",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      "disabled:pointer-events-none disabled:opacity-50",
      variants[variant],
      sizes[size],
      className,
    );

    // When asChild, merge button styles onto the child element (e.g. <Link>)
    if (asChild && isValidElement(children)) {
      return cloneElement(children as ReactElement<Record<string, unknown>>, {
        ...props,
        ref,
        className: cn(classes, (children as ReactElement<{ className?: string }>).props.className),
      });
    }

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, type ButtonProps };
