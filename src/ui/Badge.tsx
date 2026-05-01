import type { ReactNode } from "react";

type BadgeKind = "long" | "short" | "neutral" | "warn";

type BadgeProps = {
  kind: BadgeKind;
  children: ReactNode;
};

const tone: Record<BadgeKind, string> = {
  long: "bg-[var(--profit-bg)] text-profit",
  short: "bg-[var(--loss-bg)] text-loss",
  warn: "bg-[var(--warn-bg)] text-warn",
  neutral: "bg-bg-3 text-fg-2",
};

export function Badge({ kind, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-[7px] rounded-[3px] h-5 font-sans text-[10px] font-medium leading-none uppercase tracking-[0.08em] ${tone[kind]}`}
    >
      {children}
    </span>
  );
}
