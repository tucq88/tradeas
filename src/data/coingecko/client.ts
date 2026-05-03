import { CoingeckoError } from './errors';

export async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new CoingeckoError('network', e instanceof Error ? e.message : String(e));
  }

  if (response.status === 429) {
    throw new CoingeckoError('rate-limit', 'Rate limited');
  }

  if (!response.ok) {
    throw new CoingeckoError('http', `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
