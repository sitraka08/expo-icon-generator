import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium outline-none select-none transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-brand hover:text-brand-foreground",
        brand: "bg-brand text-brand-foreground hover:brightness-95",
        outline: "border border-input bg-card text-foreground hover:bg-accent",
        secondary: "bg-secondary text-foreground hover:bg-border",
        ghost: "text-subtle hover:bg-accent hover:text-foreground",
        destructive: "bg-err-bg text-err hover:brightness-95",
      },
      size: {
        default: "h-8 px-3.5",
        sm: "h-7 px-2.5 text-xs",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: { variant: "outline", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonProps) {
  const C = asChild ? Slot.Root : "button";
  return (
    <C
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
