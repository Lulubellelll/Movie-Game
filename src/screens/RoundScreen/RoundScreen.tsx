import { useEffect, useMemo, useRef, useState } from "react";
import TrailerVideo from "../../components/TrailerVideo";
import GuessForm from "../../components/GuessForm";
import ProgressDots from "../../components/ProgressDots";
import type { MovieResult } from "../../api/tmdb";
import { prefetchQueue } from "../../utils/prefetchQueue";
import styles from "./RoundScreen.module.css";

interface Props {
    round: number;
    total: number;
    onFinish: (diff: number) => void;
}

/**
 * Renders a single round of the game: loads a movie from the prefetch
 * queue, shows its trailer, and lets the user guess the IMDb rating.
 *
 * Each round is mounted with a unique key prop so React fully unmounts
 * and remounts it when the round number changes, resetting all local state.
 *
 * After a guess, a feedback toast appears for ~2 seconds showing the
 * accuracy, then the round auto-advances. The user can also click "Next"
 * to advance immediately.
 */
export default function RoundScreen({ round, total, onFinish }: Props) {
    const [movie, setMovie] = useState<MovieResult | null>(null);
    const [feedback, setFeedback] = useState<{ diff?: number; imdb?: number; skip?: boolean } | null>(null);
    const timerRef = useRef<number | null>(null);
    const advancedRef = useRef(false);
    const attemptsRef = useRef(0);


    useEffect(() => {
        async function loadFromQueue() {
            const m = await prefetchQueue.next();
            setMovie(m);
        }


        prefetchQueue.fill();
        void loadFromQueue();

        return () => {
            prefetchQueue.cancel(false);
        };
    }, []);

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    const progress = useMemo(() => Math.min(100, Math.max(0, Math.round((round - 1) / total * 100))), [round, total]);

    /**
     * Schedules the transition to the next round after a delay.
     * Uses a ref guard to prevent double-advances if the user clicks "Next"
     * while the auto-advance timer is still pending.
     */
    function scheduleAdvance(value: number, delay = 1800) {
        if (advancedRef.current) return;
        timerRef.current = window.setTimeout(() => {
            if (!advancedRef.current) {
                advancedRef.current = true;
                onFinish(value);
            }
        }, delay);
    }

    function handleGuess(userGuess: number) {
        if (!movie) return;
        const rating = movie.imdb_rating ? Number(movie.imdb_rating) : null;
        if (rating === null || Number.isNaN(rating)) {
            setFeedback({ skip: true });
            scheduleAdvance(0, 1200);
            prefetchQueue.fill();
            return;
        }
        const diff = Math.abs(userGuess - rating);
        setFeedback({ diff, imdb: rating });
        prefetchQueue.fill();
        scheduleAdvance(diff, 2000);
    }

    function handleSkip() {
        setFeedback({ skip: true });
        prefetchQueue.fill();
        scheduleAdvance(Number.NaN, 300);
    }

    /**
     * Maps the numerical accuracy difference to a severity bucket used
     * for styling the feedback toast border color.
     */
    const sev = useMemo(() => {
        if (!feedback || feedback.skip || feedback.diff === undefined) return "neutral";
        const d = feedback.diff;
        if (d <= 0.3) return "good";
        if (d <= 1.0) return "mid";
        return "bad";
    }, [feedback]);

    const feedbackMessage = useMemo(() => {
        if (!feedback || feedback.skip || feedback.diff === undefined) return "";
        const d = feedback.diff;
        if (d <= 0.3) return "Perfect!";
        if (d <= 1.0) return "Close!";
        return "Off the mark";
    }, [feedback]);

    function handleNext() {
        if (advancedRef.current) return;
        advancedRef.current = true;
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        const val = feedback?.skip ? Number.NaN : (feedback?.diff ?? 0);
        onFinish(val);
    }

    return (
        <div className={styles.round}>
            <div className={styles.top}>
                <span className={styles.roundLabel}>Round {round}/{total}</span>
                <ProgressDots current={round} total={total} />
            </div>
            <div className={styles.progress} aria-label="progress">
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.media}>
                {movie ? (
                    <TrailerVideo
                        key={movie.trailer_link}
                        title={movie?.movie_title || ""}
                        url={movie?.trailer_link || ""}
                        onUnavailable={() => {
                            const next = attemptsRef.current + 1;
                            attemptsRef.current = next;
                            if (next <= 5) {
                                prefetchQueue.fill();
                                prefetchQueue.next().then((m) => setMovie(m));
                            }
                        }}
                    />
                ) : (
                    <div className={styles.skeleton} />
                )}
            </div>
            <div className={styles.controlsRow}>
                <GuessForm onGuess={handleGuess} disabled={!movie} onSkip={handleSkip} />
            </div>
            {feedback && (
                <div className={`${styles.toast} ${sev === 'good' ? styles.toastGood : sev === 'mid' ? styles.toastMid : sev === 'bad' ? styles.toastBad : ''}`} role="status" aria-live="polite">
                    {feedback.skip ? (
                        <div className={styles.toastRow}>
                            <span className={styles.toastIcon}>⏭️</span>
                            <span className={styles.toastText}>Skipped</span>
                        </div>
                    ) : (
                        <div className={styles.toastRow}>
                            <span className={styles.toastIcon}>✅</span>
                            <span className={styles.toastText}>{feedbackMessage}</span>
                            <span className={styles.sep}>•</span>
                            <span className={styles.toastText}>Δ <span className={styles.num}>{feedback?.diff?.toFixed(2)}</span></span>
                            <span className={styles.sep}>•</span>
                            <span className={styles.sub}>IMDb <span className={styles.num}>{feedback?.imdb?.toFixed(1)}</span></span>
                        </div>
                    )}
                    <div className={styles.toastActions}>
                        <button type="button" className={styles.toastBtn} onClick={handleNext}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
