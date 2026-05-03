export class CoingeckoError extends Error {
  constructor(
    public readonly kind: 'network' | 'http' | 'rate-limit',
    message?: string,
  ) {
    super(message ?? kind);
    this.name = 'CoingeckoError';
  }
}
