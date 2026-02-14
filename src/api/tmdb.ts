/**
 * Client-side API layer for fetching random movies with trailers.
 * Calls the internal /api/random-movie endpoint and validates the response
 * before passing it to the UI layer.
 */

export type MovieResult = {
  movie_title: string;
  movie_id: number;
  release_year: string;
  imdb_rating: string | null;
  trailer_link: string;
};

export type FetchOptions = {
  signal?: AbortSignal;
  startYear?: number;
  endYear?: number;
  language?: string;
};

/**
 * Clamps the year to a safe range (1900-2100) and formats it as a
 * full date string (YYYY-01-01 or YYYY-12-31) for use as a TMDB
 * discover filter boundary.
 */
function normalizeYear(year: number | undefined, boundary: 'start' | 'end'): string | undefined {
  if (typeof year !== 'number' || !Number.isFinite(year)) return undefined;
  const safeYear = Math.trunc(year);
  if (safeYear < 1900) return boundary === 'start' ? '1900-01-01' : '1900-12-31';
  if (safeYear > 2100) return boundary === 'start' ? '2100-01-01' : '2100-12-31';
  return boundary === 'start' ? `${safeYear}-01-01` : `${safeYear}-12-31`;
}

/**
 * Validates that the language tag follows the BCP-47 pattern (e.g. "en-US").
 * Returns undefined for invalid inputs to prevent bad API requests.
 */
function normalizeLanguage(language: string | undefined): string | undefined {
  if (!language) return undefined;
  const trimmed = language.trim();
  return /^[a-z]{2,3}-[A-Z]{2}$/.test(trimmed) ? trimmed : undefined;
}

function buildRandomMovieUrl(opts: FetchOptions): string {
  const params = new URLSearchParams();
  const start = normalizeYear(opts.startYear, 'start');
  const end = normalizeYear(opts.endYear, 'end');
  const language = normalizeLanguage(opts.language);
  if (start) params.set('startYear', start);
  if (end) params.set('endYear', end);
  if (language) params.set('language', language);
  const qs = params.toString();
  return qs ? `/api/random-movie?${qs}` : '/api/random-movie';
}

/**
 * Fetches a random movie from the server API and validates that the
 * response includes a trailer link and a numeric IMDb rating.
 * Returns null on network errors or invalid data, silently swallowing
 * AbortError (from cancelled requests) without logging.
 */
export async function getRandomMovieWithTrailer(opts: FetchOptions = {}): Promise<MovieResult | null> {
  try {
    const res = await fetch(buildRandomMovieUrl(opts), { signal: opts.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as MovieResult;


    if (
      data &&
      data.trailer_link &&
      data.imdb_rating !== null &&
      !isNaN(Number(data.imdb_rating))
    ) {
      return data;
    }
    return null;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'AbortError') {
      return null;
    }
    console.error('Error fetching random movie:', err);
    return null;
  }
}
