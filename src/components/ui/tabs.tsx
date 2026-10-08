"use client";
import * as React from "react";
import { Tabs as T } from "radix-ui";
import { cn } from "@/lib/cn";

export const Tabs = T.Root;
export const TabsList = ({
  className,
  ...p
}: React.ComponentProps<typeof T.List>) => (
  <T.List className={cn("inline-flex gap-0.5", className)} {...p} />
);
export const TabsTrigger = ({
  className,
  ...p
}: React.ComponentProps<typeof T.Trigger>) => (
  <T.Trigger
    className={cn(
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium text-subtle outline-none transition-[background-color,color,box-shadow] duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
      className,
    )}
    {...p}
  />
);
export const TabsContent = ({
  className,
  ...p
}: React.ComponentProps<typeof T.Content>) => (
  <T.Content
    className={cn(
      "outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200",
      className,
    )}
    {...p}
  />
);
