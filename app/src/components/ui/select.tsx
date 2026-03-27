"use client";

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Select ──────────────────────────────────────────
// Controlled wrapper matching the Radix API: value + onValueChange + children
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

function Select({ value, onValueChange, children }: SelectProps) {
  // Find SelectTrigger and SelectContent among children, inject value/onChange
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
}

import { createContext, useContext } from "react";

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue>({});

function useSelectContext() {
  return useContext(SelectContext);
}

// ─── SelectTrigger ───────────────────────────────────
// Wraps a native <select>. Children are rendered as <option>s via SelectContent/SelectItem.
interface SelectTriggerProps {
  className?: string;
  children?: ReactNode;
}

const SelectTrigger = forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ className, children }, ref) => {
    // This is just a label/placeholder container; the actual <select> is in SelectContent
    // But for native select, we combine trigger + content into one <select>
    return (
      <div ref={ref} className={cn("select-trigger-wrapper", className)}>
        {children}
      </div>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

// ─── SelectValue ─────────────────────────────────────
// Placeholder text when no value selected
interface SelectValueProps {
  placeholder?: string;
}

function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelectContext();
  if (!value && placeholder) {
    return <span className="text-text-muted">{placeholder}</span>;
  }
  return null;
}

// ─── SelectContent ───────────────────────────────────
// Container for SelectItem children — renders them inside a native <select>
interface SelectContentProps {
  className?: string;
  children: ReactNode;
}

function SelectContent({ className, children }: SelectContentProps) {
  const { value, onValueChange } = useSelectContext();

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "flex h-10 w-full items-center rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary",
        "transition-colors duration-150",
        "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {children}
    </select>
  );
}

// ─── SelectItem ──────────────────────────────────────
type SelectItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

function SelectItem({ value, children, className, disabled }: SelectItemProps) {
  return (
    <option value={value} disabled={disabled} className={className}>
      {children}
    </option>
  );
}

// ─── SelectGroup ─────────────────────────────────────
function SelectGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// ─── SelectLabel ─────────────────────────────────────
function SelectLabel({ className, children, ...props }: SelectHTMLAttributes<HTMLOptGroupElement> & { children: ReactNode }) {
  return (
    <optgroup label={typeof children === "string" ? children : ""} className={className} />
  );
}

// ─── SelectSeparator ─────────────────────────────────
function SelectSeparator({ className }: { className?: string }) {
  return <option disabled className={cn("-mx-1 my-1", className)}>──────────</option>;
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
};
