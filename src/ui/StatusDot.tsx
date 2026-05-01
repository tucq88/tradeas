type StatusState = "ok" | "warn" | "loss";

type StatusDotProps = {
  state?: StatusState;
  title?: string;
};

const tone: Record<StatusState, string> = {
  ok: "bg-profit shadow-[0_0_0_3px_rgba(46,204,113,0.12)]",
  warn: "bg-warn shadow-[0_0_0_3px_rgba(245,165,36,0.12)]",
  loss: "bg-loss shadow-[0_0_0_3px_rgba(255,91,91,0.12)]",
};

export function StatusDot({ state = "ok", title }: StatusDotProps) {
  return (
    <span
      role="status"
      aria-label={title ?? state}
      title={title}
      className={`inline-block w-[7px] h-[7px] rounded-full ${tone[state]}`}
    />
  );
}
