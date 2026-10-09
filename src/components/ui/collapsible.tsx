'use client';
import { Collapsible as C } from 'radix-ui';
import { cn } from '@/lib/cn';
import type * as React from 'react';

export const Collapsible = C.Root;
export const CollapsibleTrigger = C.Trigger;
export const CollapsibleContent = ({ className, ...p }: React.ComponentProps<typeof C.Content>) => (
  <C.Content className={cn('overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up', className)} {...p} />
);
