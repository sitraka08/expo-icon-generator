export type ExportTab = "zip" | "files" | "config";
let handler: ((t: ExportTab) => void) | null = null;
export const onOpenExport = (fn: (t: ExportTab) => void) => {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
};
export const openExport = (t: ExportTab = "zip") => handler?.(t);
