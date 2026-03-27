import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-bg-tertiary text-text-secondary",
  accent:
    "bg-accent-muted text-accent",
  outline:
    "border border-border bg-transparent text-text-secondary",
} as const;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge, type BadgeProps };
