'use client';
import * as React from 'react';
import { Slider as S } from 'radix-ui';
import { cn } from '@/lib/cn';

export function Slider({ className, ...p }: React.ComponentProps<typeof S.Root>) {
  return (
    <S.Root className={cn('relative flex h-5 w-full touch-none select-none items-center data-[disabled]:opacity-45', className)} {...p}>
      <S.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-input">
        <S.Range className="absolute h-full bg-primary" />
      </S.Track>
      <S.Thumb className="block size-4 rounded-full border-2 border-primary bg-brand shadow-sm outline-none transition-[transform,box-shadow] duration-150 hover:scale-110 focus-visible:ring-4 focus-visible:ring-brand-soft active:scale-95" />
    </S.Root>
  );
}
