
/**
 * Validates required environment variables (TMDB and OMDB API keys) at
 * server startup and provides actionable error messages with links to
 * obtain missing keys.
 */

interface EnvConfig {
    TMDB_TOKEN?: string;
    TMDB_API_KEY?: string;
    OMDB_API_KEY?: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Checks all required env vars and returns a structured result.
 * Returns errors for missing critical keys and warnings for suboptimal
 * configurations (e.g. using v3 API key instead of v4 token).
 */
export function validateEnv(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const env: EnvConfig = {
        TMDB_TOKEN: process.env.TMDB_TOKEN,
        TMDB_API_KEY: process.env.TMDB_API_KEY,
        OMDB_API_KEY: process.env.OMDB_API_KEY,
    };


    if (!env.TMDB_TOKEN && !env.TMDB_API_KEY) {
        errors.push(
            'Missing TMDB authentication: Either TMDB_TOKEN or TMDB_API_KEY must be set.\n' +
            'Get your API key at: https://www.themoviedb.org/settings/api'
        );
    } else if (!env.TMDB_TOKEN && env.TMDB_API_KEY) {
        warnings.push(
            'Using TMDB_API_KEY (v3). Consider using TMDB_TOKEN (v4) for better performance.\n' +
            'Get your v4 token at: https://www.themoviedb.org/settings/api'
        );
    }


    if (!env.OMDB_API_KEY) {
        errors.push(
            'Missing OMDB_API_KEY: Required for fetching IMDb ratings.\n' +
            'Get your free API key at: https://www.omdbapi.com/apikey.aspx'
        );
    }


    if (env.OMDB_API_KEY && env.OMDB_API_KEY.length < 6) {
        warnings.push(
            'OMDB_API_KEY looks too short. Make sure you copied the full key.'
        );
    }

    if (env.TMDB_TOKEN && !env.TMDB_TOKEN.startsWith('eyJ')) {
        warnings.push(
            'TMDB_TOKEN doesn\'t look like a JWT token. Make sure you\'re using the v4 Read Access Token, not the API key.'
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Retrieves a single env var by key or throws with a descriptive message.
 * Use this when a missing value should halt execution.
 */
export function getEnvVar(key: keyof EnvConfig): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}\n` +
            'Please check your .env.local file and ensure all required variables are set.\n' +
            'Run the validation utility for more details.'
        );
    }
    return value;
}

/**
 * Tries each key in order and returns the first defined value.
 * Useful for supporting multiple env var names for the same credential.
 */
export function getEnvWithFallback(...keys: (keyof EnvConfig)[]): string | undefined {
    for (const key of keys) {
        const value = process.env[key];
        if (value) return value;
    }
    return undefined;
}

/**
 * Prints the validation result to console, distinguishing between
 * hard errors and soft warnings.
 */
export function logValidationResults(result: ValidationResult): void {
    if (result.isValid) {
        console.log('Environment variables validated successfully');
        if (result.warnings.length > 0) {
            console.log('\nWarnings:');
            result.warnings.forEach(w => console.log(w));
        }
    } else {
        console.error('Environment validation failed:\n');
        result.errors.forEach(e => console.error(e));
        if (result.warnings.length > 0) {
            console.log('\nWarnings:');
            result.warnings.forEach(w => console.log(w));
        }
        console.error(
            '\n💡 Tip: Create a .env.local file in your project root with the required variables.\n' +
            'See README.md for setup instructions.'
        );
    }
}
