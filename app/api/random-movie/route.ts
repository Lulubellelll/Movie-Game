import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/utils/rateLimit';
import { validateEnv } from '@/utils/env';

export const dynamic = 'force-dynamic';

// Validate environment variables on first request
let envValidated = false;
function ensureEnvValid() {
    if (!envValidated) {
        const result = validateEnv();
        if (!result.isValid) {
            const errorMessage = result.errors.join('\n');
            throw new Error(`Environment validation failed:\n${errorMessage}`);
        }
        envValidated = true;
    }
}

const TMDB_BASE = 'https://api.themoviedb.org/3';

function pick<T>(arr: T[]): T | null {
    return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

function buildUrl(path: string, params: Record<string, string | number | undefined> = {}) {
    const pathRelative = path.replace(/^\/+/, '');
    const url = new URL(`${TMDB_BASE.replace(/\/$/, '')}/${pathRelative}`);
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
    }
    return url.toString();
}

export async function GET(req: NextRequest) {
    try {
        // Validate environment variables on first request
        ensureEnvValid();

        // Rate limiting - 30 requests per minute per IP
        const clientId = getClientIdentifier(req.headers);
        const rateLimit = checkRateLimit(clientId, { interval: 60000, maxRequests: 30 });

        // Add rate limit headers to response
        const rateLimitHeaders = {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
        };

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                {
                    status: 429,
                    headers: rateLimitHeaders,
                }
            );
        }

        const token = process.env.TMDB_TOKEN; // TMDB v4 read access token
        const tmdbApiKey = process.env.TMDB_API_KEY; // optional TMDB v3 API key
        const omdbKey = process.env.OMDB_API_KEY;

        // Note: Environment validation above ensures these are set
        if ((!token && !tmdbApiKey) || !omdbKey) {
            return NextResponse.json(
                { error: 'Server not configured. Please check environment variables.' },
                { status: 500, headers: rateLimitHeaders }
            );
        }

        const { searchParams } = req.nextUrl;
        const startYearRaw = searchParams.get('startYear') || '1990-01-01';
        const endYearRaw = searchParams.get('endYear') || `${new Date().getFullYear()}-12-31`;
        const startYear = /^\d{4}-\d{2}-\d{2}$/.test(startYearRaw) ? startYearRaw : '1990-01-01';
        const endYear = /^\d{4}-\d{2}-\d{2}$/.test(endYearRaw) ? endYearRaw : `${new Date().getFullYear()}-12-31`;
        const languageRaw = searchParams.get('language') || 'en-US';
        const language = /^[a-z]{2,3}-[A-Z]{2}$/.test(languageRaw) ? languageRaw : 'en-US';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json',
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const mkParams = (opts: { minimal?: boolean; page?: number } = {}) => ({
            ...(opts.minimal
                ? {}
                : {
                    'primary_release_date.gte': startYear,
                    'primary_release_date.lte': endYear,
                }),
            include_adult: 'false',
            include_video: 'false',
            sort_by: 'popularity.desc',
            language,
            page: opts.page,
            ...(tmdbApiKey ? { api_key: tmdbApiKey } : {}),
        });

        type TmdbDiscoverResult = { results: Array<{ id: number; title: string; release_date: string }> };
        type TmdbDetails = { imdb_id: string | null };
        type TmdbVideos = { results: Array<{ site: string; type: string; key: string }> };

        // Max attempts to find a valid movie on the server side
        const MAX_ATTEMPTS = 5;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            // Random page each time
            const page = Math.floor(Math.random() * 500) + 1;

            let discoverRes = await fetch(buildUrl('/discover/movie', mkParams({ page })), { headers });
            if (!discoverRes.ok) {
                // fallback to page 1 if random page fails (unlikely but possible)
                discoverRes = await fetch(buildUrl('/discover/movie', mkParams({ minimal: true, page: 1 })), { headers });
            }

            if (!discoverRes.ok) continue; // try next attempt

            const discoverData = (await discoverRes.json()) as TmdbDiscoverResult;
            const movies = Array.isArray(discoverData.results) ? discoverData.results : [];
            if (movies.length === 0) continue;

            const randomMovie = pick(movies);
            if (!randomMovie) continue;

            const movieId = randomMovie.id;
            const movieTitle = randomMovie.title;
            const movieYear = randomMovie.release_date;

            // Details for IMDB ID
            const detailsRes = await fetch(
                buildUrl(`/movie/${movieId}`, { ...(tmdbApiKey ? { api_key: tmdbApiKey } : {}), language }),
                { headers }
            );
            if (!detailsRes.ok) continue;

            const details = (await detailsRes.json()) as TmdbDetails;
            const imdbId = details.imdb_id;
            if (!imdbId) continue;

            // OMDB for Rating
            let imdbRating: string | null = null;
            const omdbUrl = new URL('https://www.omdbapi.com/');
            omdbUrl.searchParams.set('i', imdbId);
            omdbUrl.searchParams.set('apikey', omdbKey);
            const omdbRes = await fetch(omdbUrl);
            if (omdbRes.ok) {
                const omdbData = (await omdbRes.json()) as { imdbRating?: string };
                imdbRating = omdbData?.imdbRating && omdbData.imdbRating !== 'N/A' ? String(omdbData.imdbRating) : null;
            }

            // Must have a valid numeric rating
            if (!imdbRating || isNaN(Number(imdbRating))) continue;

            // Videos for Trailer
            const videosRes = await fetch(
                buildUrl(`/movie/${movieId}/videos`, { language, ...(tmdbApiKey ? { api_key: tmdbApiKey } : {}) }),
                { headers }
            );
            if (!videosRes.ok) continue;

            const videos = (await videosRes.json()) as TmdbVideos;
            const trailer = Array.isArray(videos.results)
                ? videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
                : null;

            // Must have a trailer
            if (!trailer) continue;

            // Found a valid candidate!
            return NextResponse.json({
                movie_title: movieTitle,
                movie_id: movieId,
                release_year: movieYear,
                imdb_rating: imdbRating,
                trailer_link: `https://www.youtube-nocookie.com/embed/${trailer.key}`,
            }, {
                headers: rateLimitHeaders,
            });
        }

        return NextResponse.json(
            { error: 'Failed to find a valid movie after multiple attempts' },
            { status: 404, headers: rateLimitHeaders }
        );

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
}
