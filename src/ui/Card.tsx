import type { ReactNode } from "react";

type CardProps = {
  title: string;
  count?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
};

export function Card({ title, count, action, children }: CardProps) {
  return (
    <section className="flex flex-col bg-bg-1 border border-border-1 rounded-md">
      <header className="flex items-center justify-between h-11 px-[18px] border-b border-border-1">
        <h3 className="m-0 flex items-center gap-2 text-fg-1 font-sans font-medium text-[13px] leading-none lowercase">
          {title}
          {count !== undefined && (
            <span className="inline-flex items-center justify-center bg-bg-3 text-fg-2 rounded-[10px] px-[7px] h-[18px] font-mono font-medium text-[11px] leading-none">
              {count}
            </span>
          )}
        </h3>
        {action}
      </header>
      <div className="flex flex-col gap-3 px-[18px] pt-[14px] pb-4">{children}</div>
    </section>
  );
}
