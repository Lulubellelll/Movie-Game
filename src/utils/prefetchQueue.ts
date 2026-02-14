/**
 * Prefetch queue that pre-loads movie data in the background so the UI
 * can serve the next round immediately without waiting for a network call.
 *
 * Design overview:
 * - Maintains a buffer of ready-to-use MovieResult items (default size: 3).
 * - Deduplicates movies by ID to avoid showing the same film twice.
 * - Limits concurrent fetches to avoid overloading the API.
 * - Uses exponential backoff with jitter on transient failures.
 * - Exposes a singleton instance shared across all screens.
 */
import { getRandomMovieWithTrailer, type MovieResult } from "../api/tmdb";


export type PrefetchStats = {
  queued: number;
  servedImmediate: number;
  servedAfterWait: number;
  timeouts: number;
  inFlightMax: number;
};

export type PrefetchFilters = {
  startYear?: number;
  endYear?: number;
  language?: string;
};


export class PrefetchQueue {
  private size: number;
  private concurrency: number;
  private queue: MovieResult[] = [];
  private seenIds = new Set<number>();
  private inFlight = new Set<AbortController>();
  private filling = false;
  private stats: PrefetchStats = {
    queued: 0,
    servedImmediate: 0,
    servedAfterWait: 0,
    timeouts: 0,
    inFlightMax: 0,
  };
  private filters: PrefetchFilters = {};

  constructor(opts?: { size?: number; concurrency?: number }) {
    this.size = opts?.size ?? this.readNumber('prefetchSize', 3);
    this.concurrency = Math.max(1, opts?.concurrency ?? this.readNumber('prefetchConcurrency', 2));
  }

  get length() { return this.queue.length; }
  getStats(): PrefetchStats { return { ...this.stats }; }
  resetStats() { this.stats = { queued: 0, servedImmediate: 0, servedAfterWait: 0, timeouts: 0, inFlightMax: 0 }; }

  setConfig(opts: { size?: number; concurrency?: number }) {
    if (opts.size && opts.size > 0) this.size = opts.size;
    if (opts.concurrency && opts.concurrency > 0) this.concurrency = opts.concurrency;
    this.log('setConfig', { size: this.size, concurrency: this.concurrency });
    this.fill();
  }

  setFilters(filters: PrefetchFilters) {
    const same =
      this.filters.startYear === filters.startYear &&
      this.filters.endYear === filters.endYear &&
      this.filters.language === filters.language;
    if (same) return;
    this.filters = { ...filters };
    this.seenIds.clear();
    this.cancel(true);
    this.fill();
    this.log('setFilters', this.filters);
  }

  /**
   * Kicks off background fetch loops until the buffer is full.
   * Subsequent calls while already filling are no-ops.
   * Uses a short setTimeout between iterations to avoid a synchronous tight loop.
   */
  fill() {
    if (this.filling) return;
    this.filling = true;
    const tick = async () => {
      try {
        while (this.queue.length < this.size && this.inFlight.size < this.concurrency) {
          void this.fillOne();
          this.stats.inFlightMax = Math.max(this.stats.inFlightMax, this.inFlight.size);
        }
      } finally {
        this.filling = false;
        if (this.queue.length < this.size && this.inFlight.size < this.concurrency) {
          setTimeout(() => this.fill(), 10);
        }
      }
    };
    void tick();
  }

  /**
   * Returns the next movie from the buffer. If the buffer is empty, waits
   * up to timeoutMs for a background fetch to complete before giving up.
   * Automatically triggers a refill after each consumption.
   */
  async next(timeoutMs = 8000): Promise<MovieResult | null> {
    if (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.stats.servedImmediate++;
      this.log('serve immediate', { id: item.movie_id, q: this.queue.length });
      this.fill();
      return item;
    }

    this.fill();
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (this.queue.length > 0) {
        const item = this.queue.shift()!;
        this.stats.servedAfterWait++;
        this.log('serve after wait', { id: item.movie_id, q: this.queue.length });
        this.fill();
        return item;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    this.stats.timeouts++;
    this.log('timeout waiting for item');
    return null;
  }

  /**
   * Aborts all in-flight fetch requests and optionally empties the buffer.
   * Called on unmount to clean up network activity.
   */
  cancel(clearQueue = false) {
    for (const c of this.inFlight) c.abort();
    this.inFlight.clear();
    if (clearQueue) this.queue = [];
  }
  /**
   * Attempts one fetch cycle: retries up to 6 times with backoff,
   * skips duplicates, and pushes a valid result into the queue.
   */
  private async fillOne() {
    const controller = new AbortController();
    this.inFlight.add(controller);
    const maxAttempts = 6;
    let attempt = 0;
    try {
      while (attempt < maxAttempts && this.queue.length < this.size) {
        attempt++;
        const candidate = await getRandomMovieWithTrailer({
          signal: controller.signal,
          startYear: this.filters.startYear,
          endYear: this.filters.endYear,
          language: this.filters.language,
        });
        if (!candidate) {
          await this.backoff(attempt);
          continue;
        }
        if (this.seenIds.has(candidate.movie_id)) {
          continue;
        }
        this.seenIds.add(candidate.movie_id);
        this.queue.push(candidate);
        this.stats.queued++;
        this.log('queued', { id: candidate.movie_id, q: this.queue.length });
        break;
      }
    } catch {
    } finally {
      this.inFlight.delete(controller);
    }
  }
  /**
   * Exponential backoff with jitter. Base delay starts at 120ms and
   * grows by factor 1.6 per attempt, capped at 1500ms.
   */
  private async backoff(attempt: number) {
    const base = 120;
    const jitter = Math.floor(Math.random() * 80);
    const delay = Math.min(1500, base * Math.pow(1.6, attempt) + jitter);
    await new Promise(r => setTimeout(r, delay));
  }

  private debugEnabled(): boolean {
    try {
      const val = localStorage.getItem('prefetchDebug');
      return val === '1' || val === 'true';
    } catch {
      return false;
    }
  }

  private log(msg: string, data?: unknown) {
    if (this.debugEnabled()) {
      console.debug(`[PrefetchQueue] ${msg}`, data ?? '');
    }
  }

  private readNumber(key: string, def: number): number {
    try {
      const v = localStorage.getItem(key);
      if (!v) return def;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : def;
    } catch {
      return def;
    }
  }
}

/** Shared singleton -- one queue is reused across all rounds and screens. */
export const prefetchQueue = new PrefetchQueue({ size: 3, concurrency: 2 });


export const setPrefetchConfig = (opts: { size?: number; concurrency?: number }) => prefetchQueue.setConfig(opts);
export const getPrefetchStats = () => prefetchQueue.getStats();
export const resetPrefetchStats = () => prefetchQueue.resetStats();
export const setPrefetchFilters = (filters: PrefetchFilters) => prefetchQueue.setFilters(filters);
