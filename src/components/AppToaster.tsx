"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-lg",
          success: "text-[var(--color-primary)]",
          error: "text-red-600",
        },
      }}
    />
  );
}
