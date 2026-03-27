"use client";

import {
  useRef,
  useEffect,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Dialog (root wrapper) ───────────────────────────
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

// Internal context to pass open/onOpenChange to children
import { createContext, useContext } from "react";

interface DialogContextValue {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({});

function useDialogContext() {
  return useContext(DialogContext);
}

// ─── DialogTrigger ───────────────────────────────────
interface DialogTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function DialogTrigger({ children, ...props }: DialogTriggerProps) {
  const { onOpenChange } = useDialogContext();
  return (
    <button type="button" onClick={() => onOpenChange?.(true)} {...props}>
      {children}
    </button>
  );
}

// ─── DialogContent ───────────────────────────────────
interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  // Handle backdrop click
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        handleClose();
      }
    },
    [handleClose],
  );

  // Handle native close event (Escape key)
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      handleClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [handleClose]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 z-50 m-auto",
        "w-full max-w-lg rounded-lg border border-border bg-bg-primary p-6 shadow-lg",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "open:animate-in open:fade-in-0 open:zoom-in-95",
        className,
      )}
      onClick={handleDialogClick}
      {...(props as React.HTMLAttributes<HTMLDialogElement>)}
    >
      <div className="relative">
        {children}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-0 top-0 rounded-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </dialog>
  );
}

// ─── DialogHeader ────────────────────────────────────
function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

// ─── DialogFooter ────────────────────────────────────
function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

// ─── DialogTitle ─────────────────────────────────────
function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-text-primary", className)}
      {...props}
    />
  );
}

// ─── DialogDescription ──────────────────────────────
function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    />
  );
}

// ─── DialogClose ─────────────────────────────────────
interface DialogCloseProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function DialogClose({ children, ...props }: DialogCloseProps) {
  const { onOpenChange } = useDialogContext();
  return (
    <button type="button" onClick={() => onOpenChange?.(false)} {...props}>
      {children}
    </button>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
