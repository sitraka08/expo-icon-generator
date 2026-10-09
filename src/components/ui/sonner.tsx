"use client";
import { Toaster as S } from "sonner";
import { useStudio } from "@/lib/store";

export function Toaster() {
  const { theme } = useStudio();
  return (
    <S
      theme={theme}
      position="bottom-right"
      closeButton
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-border !bg-popover !text-foreground !shadow-[var(--shadow-lg)] !font-[var(--font)] !text-[13px]",
          title: "!font-semibold",
          description: "!text-subtle !text-[12px] !whitespace-pre-line",
          closeButton: "!border-border !bg-card !text-foreground",
        },
      }}
    />
  );
}
