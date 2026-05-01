import { BinanceError } from './errors';

export async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new BinanceError('network', e instanceof Error ? e.message : String(e));
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new BinanceError('http', `HTTP ${response.status}`);
    }
    if (
      typeof body === 'object' &&
      body !== null &&
      'code' in body &&
      (body as { code: number }).code === -1121
    ) {
      throw new BinanceError('unknown-symbol', 'Invalid symbol');
    }
    throw new BinanceError('http', `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
