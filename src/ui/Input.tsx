import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  suffix?: string;
};

export function Input({ suffix, className, ...rest }: InputProps) {
  return (
    <label className="flex items-center gap-2 bg-bg-inset border border-border-1 rounded-sm px-[10px] h-[34px] focus-within:border-border-emph focus-within:shadow-[0_0_0_2px_rgba(91,157,255,0.40)] transition-colors">
      <input
        {...rest}
        className={cn(
          "bg-transparent border-0 outline-0 text-fg-1 flex-1 min-w-0 font-mono text-sm font-medium leading-none tabular-nums",
          "[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
          className,
        )}
      />
      {suffix && (
        <span className="text-fg-3 font-mono text-[11px] font-medium leading-none">
          {suffix}
        </span>
      )}
    </label>
  );
}
