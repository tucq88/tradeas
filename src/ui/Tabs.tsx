import type { ReactNode } from "react";

type Tab = { id: string; label: ReactNode };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      className="inline-flex p-[3px] bg-bg-2 border border-border-1 rounded-sm gap-[2px]"
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={
              isActive
                ? "bg-bg-1 text-fg-1 border-0 font-sans text-xs font-medium leading-none px-[10px] h-6 rounded-[4px] cursor-pointer"
                : "bg-transparent text-fg-2 border-0 font-sans text-xs font-medium leading-none px-[10px] h-6 rounded-[4px] cursor-pointer hover:text-fg-1"
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
