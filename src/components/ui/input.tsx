import * as React from 'react';
import { cn } from '@/lib/cn';

export function Input({ className, type = 'text', ...p }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn('h-8 w-full min-w-0 rounded-md border border-input bg-card px-2.5 text-[13px] outline-none transition-[border-color,box-shadow,background-color] hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-brand-soft aria-invalid:border-err aria-invalid:bg-err-bg disabled:opacity-50', className)}
      {...p}
    />
  );
}
