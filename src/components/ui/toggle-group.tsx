"use client";
import * as React from "react";
import { ToggleGroup as G } from "radix-ui";
import { cn } from "@/lib/cn";

export interface SegOption<T extends string> {
  v: T;
  label: React.ReactNode;
  disabled?: boolean;
  title?: string;
}

/** Single-select segmented control (radix ToggleGroup). `solid` = ink pill used in the workspace header. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  full,
  solid,
}: {
  label: string;
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  full?: boolean;
  solid?: boolean;
}) {
  return (
    <G.Root
      type="single"
      value={value}
      aria-label={label}
      onValueChange={(v) => {
        if (v) onChange(v as T);
      }}
      className={cn(
        "inline-flex gap-0.5 rounded-md p-0.5",
        "bg-secondary",
        full && "flex w-full",
      )}
    >
      {options.map((o) => (
        <G.Item
          key={o.v}
          value={o.v}
          disabled={o.disabled}
          title={o.title}
          className={cn(
            "inline-flex h-7 items-center justify-center gap-1.5 rounded-[4px] px-2.5 text-[12.5px] font-medium whitespace-nowrap text-subtle outline-none transition-[background-color,color,box-shadow] duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
            "data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[var(--lift)]",
            full && "flex-1",
          )}
        >
          {o.label}
        </G.Item>
      ))}
    </G.Root>
  );
}
