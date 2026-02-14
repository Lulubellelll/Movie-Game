import { useId, useMemo, useState } from "react";
import styles from "./MenuScreen.module.css";
import SegmentedControl from "../../components/SegmentedControl";

interface Props {
    onStart: (options: { rounds: number; startYear: number; endYear: number }) => void;
    initialRounds?: number;
    initialStartYear: number;
    initialEndYear: number;
}

/**
 * Main menu screen where the player configures the game before starting.
 *
 * Allows setting the number of rounds via a segmented control and
 * optionally narrowing the movie release year window via an expandable
 * advanced-settings panel. Both year selects auto-correct each other
 * so the start year never exceeds the end year.
 */
export default function MenuScreen({
    onStart,
    initialRounds = 5,
    initialStartYear,
    initialEndYear,
}: Props) {
    const [rounds, setRounds] = useState(initialRounds);
    const [startYear, setStartYear] = useState(String(initialStartYear));
    const [endYear, setEndYear] = useState(String(initialEndYear));
    const [error, setError] = useState<string | null>(null);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const yearOptions = useMemo(() => {
        const minYear = 1900;
        const maxYear = new Date().getFullYear();
        return Array.from({ length: maxYear - minYear + 1 }, (_, idx) => String(minYear + idx));
    }, []);
    const startSelectId = "startYearSelect";
    const endSelectId = "endYearSelect";
    const advancedPanelId = useId();

    const startYearOptions = useMemo(() => {
        const end = Number.parseInt(endYear, 10);
        return yearOptions.filter((y) => Number(y) <= end);
    }, [yearOptions, endYear]);
    const endYearOptions = useMemo(() => {
        const start = Number.parseInt(startYear, 10);
        return yearOptions.filter((y) => Number(y) >= start);
    }, [yearOptions, startYear]);

    function handleStart() {
        const startValue = startYear.trim();
        const endValue = endYear.trim();
        if (!startValue || !endValue) {
            setError("Enter both start and end years.");
            setAdvancedOpen(true);
            return;
        }
        const start = Number.parseInt(startValue, 10);
        const end = Number.parseInt(endValue, 10);
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            setError("Use 4-digit years.");
            setAdvancedOpen(true);
            return;
        }
        const currentYear = new Date().getFullYear();
        if (start < 1900 || end < 1900 || start > currentYear || end > currentYear) {
            setError(`Choose years between 1900 and ${currentYear}.`);
            setAdvancedOpen(true);
            return;
        }
        if (start > end) {
            setError("Start year must be before end year.");
            setAdvancedOpen(true);
            return;
        }
        setError(null);
        onStart({ rounds, startYear: start, endYear: end });
    }

    return (
        <div className={styles.menu}>
            <span className="label-upper">Movie Game</span>
            <h1 className="h1">Guess the Rating</h1>
            <p className="lead">Watch a trailer. Guess the IMDb score.</p>
            <div className={styles.controls}>
                <span className={styles.controlLabel}>Rounds</span>
                <SegmentedControl
                    options={[3, 5, 7, 10].map(n => ({ label: String(n), value: n }))}
                    value={rounds}
                    onChange={(v) => {
                        setRounds(v);
                        if (error) setError(null);
                    }}
                />
            </div>
            <div className={`${styles.advanced} ${advancedOpen ? styles.advancedOpen : ""}`}>
                <button
                    type="button"
                    className={styles.advancedSummary}
                    onClick={() => setAdvancedOpen((open) => !open)}
                    aria-expanded={advancedOpen}
                    aria-controls={advancedPanelId}
                >
                    Advanced settings
                    <span
                        className={`${styles.summaryIcon} ${advancedOpen ? styles.summaryIconOpen : ""}`}
                        aria-hidden="true"
                    >
                        ▾
                    </span>
                </button>
                <div
                    id={advancedPanelId}
                    className={styles.advancedPanel}
                    aria-hidden={!advancedOpen}
                >
                    <label className={styles.controlLabel} htmlFor={startSelectId}>
                        Release window
                    </label>
                    <div className={styles.yearRow}>
                        <div className={styles.selectWrapper}>
                            <select
                                id={startSelectId}
                                className={styles.menuSelect}
                                value={startYear}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setStartYear(next);
                                    if (Number(next) > Number(endYear)) setEndYear(next);
                                    if (error) setError(null);
                                }}
                                aria-label="Start year"
                            >
                                {startYearOptions.map((year) => (
                                    <option key={`start-${year}`} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <span className={styles.selectLabel}>Start</span>
                        </div>
                        <span className={styles.rangeDash}>to</span>
                        <div className={styles.selectWrapper}>
                            <select
                                id={endSelectId}
                                className={styles.menuSelect}
                                value={endYear}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setEndYear(next);
                                    if (Number(startYear) > Number(next)) setStartYear(next);
                                    if (error) setError(null);
                                }}
                                aria-label="End year"
                            >
                                {endYearOptions.map((year) => (
                                    <option key={`end-${year}`} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <span className={styles.selectLabel}>End</span>
                        </div>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                </div>
            </div>
            <div className={styles.actions}>
                <button className="btnPrimary" onClick={handleStart}>Start</button>
            </div>
            <footer className={styles.footer}>
                <a
                    href="https://www.github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.githubLink}
                    aria-label="View source on GitHub"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                    </svg>
                    <span>Open source</span>
                </a>
            </footer>
        </div>
    );
}
