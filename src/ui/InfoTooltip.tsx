import { useId } from 'react';

type Props = { text: string };

export function InfoTooltip({ text }: Props) {
  const id = useId();
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-describedby={id}
        className="peer inline-flex items-center justify-center w-[14px] h-[14px] text-fg-4 hover:text-fg-2 focus-visible:text-fg-2 focus-visible:outline-none cursor-default text-[11px] leading-none"
      >
        ⓘ
      </button>
      <span
        id={id}
        role="tooltip"
        className="absolute z-10 hidden peer-hover:block peer-focus-visible:block bottom-full left-0 mb-1 w-[220px] max-w-[220px] text-[11px] bg-bg-1 border border-border-1 rounded-sm px-2 py-[6px] text-fg-2 normal-case font-sans font-normal leading-snug pointer-events-none"
      >
        {text}
      </span>
    </span>
  );
}
