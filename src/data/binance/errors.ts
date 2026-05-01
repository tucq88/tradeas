export type BinanceErrorKind = 'network' | 'http' | 'unknown-symbol';

export class BinanceError extends Error {
  kind: BinanceErrorKind;

  constructor(kind: BinanceErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'BinanceError';
    this.kind = kind;
  }
}
