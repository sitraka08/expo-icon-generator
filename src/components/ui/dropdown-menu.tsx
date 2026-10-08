"use client";
import * as React from "react";
import { DropdownMenu as M } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuRadioGroup = M.RadioGroup;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-48 origin-[var(--radix-dropdown-menu-content-transform-origin)] overflow-hidden rounded-lg border border-border bg-popover p-1 text-foreground shadow-[var(--shadow-lg)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[state=open]:duration-150",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-100",
          className,
        )}
        {...props}
      />
    </M.Portal>
  );
}

const item =
  "relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none transition-colors data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
export const DropdownMenuItem = ({
  className,
  ...p
}: React.ComponentProps<typeof M.Item>) => (
  <M.Item className={cn(item, className)} {...p} />
);
export const DropdownMenuLabel = ({
  className,
  ...p
}: React.ComponentProps<typeof M.Label>) => (
  <M.Label
    className={cn(
      "px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
      className,
    )}
    {...p}
  />
);
export const DropdownMenuSeparator = ({
  className,
  ...p
}: React.ComponentProps<typeof M.Separator>) => (
  <M.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...p} />
);

export function DropdownMenuRadioItem({
  className,
  children,
  ...p
}: React.ComponentProps<typeof M.RadioItem>) {
  return (
    <M.RadioItem
      className={cn(item, "pr-8 data-[state=checked]:bg-brand-soft", className)}
      {...p}
    >
      {children}
      <M.ItemIndicator className="absolute right-2 top-2.5">
        <Check size={14} strokeWidth={2} />
      </M.ItemIndicator>
    </M.RadioItem>
  );
}
