import {
  AppWindow, Check, ChevronDown, CircleX, Code2, Copy, Download, Ellipsis, File, Image, Info, Layers, Lock, Maximize, Minus, Moon, Package,
  Pencil, Plus, Redo2, RotateCcw, Scan, Smartphone, Sparkles, Sun, Trash2, TriangleAlert, Undo2, Upload, X, type LucideIcon,
} from 'lucide-react';

const MAP = {
  upload: Upload, download: Download, undo: Undo2, redo: Redo2, sun: Sun, moon: Moon, reset: RotateCcw, code: Code2, copy: Copy, check: Check,
  chev: ChevronDown, alert: TriangleAlert, error: CircleX, info: Info, image: Image, file: File, package: Package, layers: Layers, app: AppWindow,
  phone: Smartphone, pencil: Pencil, plus: Plus, minus: Minus, more: Ellipsis, x: X, trash: Trash2, scan: Scan, lock: Lock, fit: Maximize, sparkle: Sparkles,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof MAP;

export function Icon({ name, size, className = '' }: { name: IconName; size?: 'sm' | 'lg'; className?: string }) {
  const C = MAP[name];
  const px = size === 'sm' ? 14 : size === 'lg' ? 28 : 16;
  return <C width={px} height={px} strokeWidth={1.75} className={`shrink-0 ${className}`} aria-hidden="true" />;
}

/** Kept for API compatibility — lucide icons are bundled, so no sprite is needed. */
export function Sprite() { return null; }
