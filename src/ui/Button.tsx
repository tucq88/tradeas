import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({
  variant = "ghost",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center h-9 px-4 rounded-sm font-sans text-[13px] font-semibold leading-none lowercase cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";
  const styles =
    variant === "primary"
      ? "bg-accent text-bg-0 hover:brightness-110"
      : "bg-transparent border border-border-1 text-fg-2 hover:bg-bg-3 hover:text-fg-1";
  return <button type={type} className={cn(base, styles, className)} {...rest} />;
}
