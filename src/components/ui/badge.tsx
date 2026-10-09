import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva('inline-flex h-[18px] items-center gap-1 rounded-sm px-1.5 text-[10.5px] font-semibold leading-none whitespace-nowrap', {
  variants: {
    variant: {
      default: 'bg-secondary text-subtle',
      ok: 'bg-ok-bg text-ok',
      warn: 'bg-warn-bg text-warn',
      err: 'bg-err-bg text-err',
      brand: 'bg-brand text-brand-foreground',
      outline: 'border border-input text-subtle',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
