import { useState } from 'react';

type Props = { symbol: string; src?: string };

export function TokenLogo({ symbol, src: srcOverride }: Props) {
  const [failed, setFailed] = useState(false);
  const upper = symbol.toUpperCase();
  const src = srcOverride ?? `https://assets.coincap.io/assets/icons/${upper.toLowerCase()}@2x.png`;

  if (failed) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-bg-3 text-fg-2 font-sans font-semibold text-[9px] uppercase shrink-0">
        {upper[0]}
      </span>
    );
  }

  return (
    <img
      src={src}
      width={20}
      height={20}
      alt={symbol}
      onError={() => setFailed(true)}
      className="w-5 h-5 rounded-full shrink-0"
    />
  );
}
