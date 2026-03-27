"use client";

import {
  createContext,
  useContext,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ─── Context ─────────────────────────────────────────
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
});

function useTabsContext() {
  return useContext(TabsContext);
}

// ─── Tabs (root) ─────────────────────────────────────
interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

function Tabs({ value: controlledValue, defaultValue = "", onValueChange, className, children, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const handleChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ─── TabsList ────────────────────────────────────────
function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-bg-secondary p-1",
        className,
      )}
      {...props}
    />
  );
}

// ─── TabsTrigger ─────────────────────────────────────
interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

function TabsTrigger({ value, className, disabled, ...props }: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = useTabsContext();
  const isActive = value === activeValue;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary",
        "transition-colors duration-150",
        "hover:text-text-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-bg-primary text-text-primary shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

// ─── TabsContent ─────────────────────────────────────
interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();

  if (value !== activeValue) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        "mt-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
