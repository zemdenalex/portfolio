import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, type = "text", ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "h-10 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "transition-colors duration-150",
            "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input, type InputProps };
