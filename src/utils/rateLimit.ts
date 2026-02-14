/**
 * In-memory sliding-window rate limiter.
 * Tracks request counts per client identifier within configurable time windows.
 * Entries are automatically cleaned up every 60 seconds.
 * Note: this is per-process; for multi-instance deployments a shared store
 * (e.g. Redis) should be used instead.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const limitMap = new Map<string, RateLimitEntry>();


setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of limitMap.entries()) {
        if (now > entry.resetAt) {
            limitMap.delete(key);
        }
    }
}, 60000);

export interface RateLimitConfig {
    interval: number;
    maxRequests: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Evaluates whether a request from the given identifier should be allowed.
 * Creates a new time window if none exists or the previous one expired,
 * otherwise increments the counter and checks against maxRequests.
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { interval: 60000, maxRequests: 30 }
): RateLimitResult {
    const now = Date.now();
    const entry = limitMap.get(identifier);


    if (!entry || now > entry.resetAt) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetAt: now + config.interval,
        };
        limitMap.set(identifier, newEntry);

        return {
            success: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - 1,
            reset: newEntry.resetAt,
        };
    }


    if (entry.count >= config.maxRequests) {
        return {
            success: false,
            limit: config.maxRequests,
            remaining: 0,
            reset: entry.resetAt,
        };
    }


    entry.count++;
    limitMap.set(identifier, entry);

    return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - entry.count,
        reset: entry.resetAt,
    };
}

/**
 * Extracts the originating client IP from request headers.
 * Checks X-Forwarded-For first (taking only the leftmost entry),
 * then X-Real-IP, and falls back to "unknown".
 */
export function getClientIdentifier(headers: Headers): string {

    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {

        return forwarded.split(',')[0].trim();
    }


    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    return 'unknown';
}
