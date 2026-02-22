import { useEffect, useMemo, useState } from "react";
import styles from "./GuessForm.module.css";

type GuessFormProps = {
    onGuess: (guess: number) => void;
    disabled?: boolean;
    onSkip?: () => void;
}

/**
 * Rating guess input form with a slider (0-10) and submit/skip buttons.
 *
 * Slider step is 0.1 by default; holding the Alt/Option key activates
 * "fine mode" which switches the step to whole integers for quicker
 * coarse adjustments. The slider track fill is rendered via a CSS
 * linear-gradient computed from the current value.
 */
export default function GuessForm({ onGuess, disabled = false, onSkip }: GuessFormProps) {
    const [input, setInput] = useState(5);
    const [fineMode, setFineMode] = useState(false);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) { if (e.altKey) setFineMode(true); }
        function onKeyUp() { setFineMode(false); }
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
    }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (disabled) return;
        onGuess(input);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = Number(e.target.value);
        setInput(fineMode ? Math.round(val) : Number(val.toFixed(1)));
    }

    const percent = useMemo(() => Math.max(0, Math.min(100, (input / 10) * 100)), [input]);

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.headerRow}>
                <label htmlFor="guess-range" className={styles.label}>
                    IMDb Rating
                    <span className={styles.tooltip}>
                        <svg className={styles.infoIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span className={styles.tooltipText}>Hold Alt/Option for whole numbers</span>
                    </span>
                </label>
                <span className={styles.value}>
                    {fineMode ? Math.round(input) : input.toFixed(1)}
                    {fineMode && <span className={styles.fineBadge}>Fine mode</span>}
                </span>
            </div>

            <input
                id="guess-range"
                type="range"
                min="0"
                max="10"
                step={fineMode ? 1 : 0.1}
                value={input}
                onChange={handleChange}
                className={`${styles.input} ${fineMode ? styles.inputFineMode : ''}`}
                disabled={disabled}
                style={{ background: `linear-gradient(90deg, var(--text) ${percent}%, var(--border) ${percent}%)` }}
            />

            <div className={styles.actions}>
                {onSkip && (
                    <button
                        type="button"
                        className={styles.iconSecondary}
                        onClick={onSkip}
                        disabled={disabled}
                        aria-label="Skip round"
                        title="Skip round"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className={styles.btnText}>Skip</span>
                    </button>
                )}
                <button
                    type="submit"
                    className={styles.iconPrimary}
                    disabled={disabled}
                    aria-label="Submit guess"
                    title="Submit guess"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={styles.btnText}>Guess</span>
                </button>
            </div>
        </form>
    );
}
