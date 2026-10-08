"use client";
import * as React from "react";
import { Tooltip as T } from "radix-ui";
import { cn } from "@/lib/cn";

export const TooltipProvider = ({
  delayDuration = 250,
  ...p
}: React.ComponentProps<typeof T.Provider>) => (
  <T.Provider delayDuration={delayDuration} {...p} />
);

/** Wraps a single focusable child with a tooltip. Tooltips never carry essential info on their own. */
export function Tip({
  label,
  children,
  side = "bottom",
}: {
  label: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-[60] origin-[var(--radix-tooltip-content-transform-origin)] whitespace-pre rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground",
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-150",
          )}
        >
          {label}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
