"use client";
import * as React from "react";
import { Select as S } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Select = S.Root;
export const SelectValue = S.Value;

export function SelectTrigger({
  className,
  children,
  ...p
}: React.ComponentProps<typeof S.Trigger>) {
  return (
    <S.Trigger
      className={cn(
        "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-2.5 text-[13px] outline-none transition-[border-color,box-shadow] hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-brand-soft data-[placeholder]:text-muted-foreground",
        className,
      )}
      {...p}
    >
      {children}
      <S.Icon asChild>
        <ChevronDown
          size={14}
          className="text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </S.Icon>
    </S.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...p
}: React.ComponentProps<typeof S.Content>) {
  return (
    <S.Portal>
      <S.Content
        position="popper"
        sideOffset={4}
        className={cn(
          "z-50 min-w-[var(--radix-select-trigger-width)] origin-[var(--radix-select-content-transform-origin)] overflow-hidden rounded-lg border border-border bg-popover p-1 text-foreground shadow-[var(--shadow-lg)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[state=open]:duration-150",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-100",
          className,
        )}
        {...p}
      >
        <S.Viewport>{children}</S.Viewport>
      </S.Content>
    </S.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...p
}: React.ComponentProps<typeof S.Item>) {
  return (
    <S.Item
      className={cn(
        "relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2 pr-8 text-[13px] outline-none data-[highlighted]:bg-accent data-[disabled]:opacity-50",
        className,
      )}
      {...p}
    >
      <S.ItemText>{children}</S.ItemText>
      <S.ItemIndicator className="absolute right-2">
        <Check size={14} strokeWidth={2} />
      </S.ItemIndicator>
    </S.Item>
  );
}
