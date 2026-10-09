'use client';
import * as React from 'react';
import { Switch as S } from 'radix-ui';
import { cn } from '@/lib/cn';

export function Switch({ className, ...p }: React.ComponentProps<typeof S.Root>) {
  return (
    <S.Root className={cn('peer inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-input outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-45', className)} {...p}>
      <S.Thumb className="pointer-events-none block size-4 translate-x-0.5 rounded-full bg-card shadow-sm transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-brand" />
    </S.Root>
  );
}
