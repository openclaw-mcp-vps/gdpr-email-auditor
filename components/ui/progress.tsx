import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("h-2.5 w-full rounded-full bg-slate-800", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
