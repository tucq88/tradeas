import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricRowProps = {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  secondary?: ReactNode;
};

export function MetricRow({ label, value, valueClassName, secondary }: MetricRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 h-9">
      <span className="font-sans text-[10px] font-medium leading-none uppercase tracking-[0.08em] text-fg-3">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[13px] tabular-nums text-fg-1",
          valueClassName,
        )}
      >
        {value}
        {secondary !== undefined && (
          <span className="text-fg-3 ml-[2px]"> · {secondary}</span>
        )}
      </span>
    </div>
  );
}
