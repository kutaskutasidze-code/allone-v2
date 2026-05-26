import { incrementUsage } from './api-usage.js';

export const API_USAGE_KEY = 'google_places';
export const FIELD_MASK = 'places.displayName,places.nationalPhoneNumber,places.internationalPhoneNumber,places.formattedAddress,places.websiteUri,places.types,places.googleMapsUri';

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

export interface SearchTextResult<T> {
  data: T;
  newCount: number;
}

export async function searchText<T>(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<SearchTextResult<T>> {
  // Increment before the fetch: if Google processes the request but the network
  // response fails partway, we've still been billed — count it.
  const newCount = await incrementUsage(API_USAGE_KEY);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places API ${res.status}: ${text}`);
  }

  return { data: (await res.json()) as T, newCount };
}
