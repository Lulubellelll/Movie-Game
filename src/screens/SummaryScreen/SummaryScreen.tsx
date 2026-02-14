import { useEffect, useState } from "react";
import styles from "./SummaryScreen.module.css";

interface Props {
    score: number;
    log: number[];
    onReplay: () => void;
}

/**
 * End-of-game screen that displays the player's performance statistics,
 * a per-round bar chart, and share buttons.
 *
 * Statistics are computed from the log array where each entry is either
 * a finite number (the absolute difference between the guess and actual
 * IMDb rating) or NaN (indicating a skipped round).
 */
export default function SummaryScreen({ score, log, onReplay }: Props) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const t = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(t);
        }
    }, [copied]);

    const valid = log.filter((n) => Number.isFinite(n)) as number[];
    const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    const best = valid.length ? Math.min(...valid) : 0;
    const worst = valid.length ? Math.max(...valid) : 0;
    const roundsPlayed = valid.length;
    const skippedRounds = log.length - roundsPlayed;
    const tightRounds = valid.filter((n) => n <= 0.5).length;

    let bestIndex = -1;
    let worstIndex = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    let worstDiff = Number.NEGATIVE_INFINITY;
    log.forEach((value, index) => {
        if (!Number.isFinite(value)) return;
        const diff = value as number;
        if (diff < bestDiff) {
            bestDiff = diff;
            bestIndex = index;
        }
        if (diff > worstDiff) {
            worstDiff = diff;
            worstIndex = index;
        }
    });

    /**
     * Converts a raw difference into a 0-10 "closeness" score where
     * 10 means a perfect guess and 0 means the maximum possible miss.
     */
    function closeness(diff: number) {
        const score = 10 - diff;
        return Math.max(0, Math.min(10, score));
    }

    /**
     * Interpolates a bar color from red (score 0) to green (score 10)
     * using direct RGB channel mixing. Null scores (skipped rounds)
     * get a translucent border-color fill.
     */
    function barColor(score: number | null) {
        if (score === null) return 'color-mix(in oklab, var(--border) 70%, transparent)';
        const pct = Math.max(0, Math.min(1, score / 10));
        const red = Math.round(235 * (1 - pct));
        const green = Math.round(60 + 195 * pct);
        const blue = Math.round(90 + 20 * pct);
        return `rgb(${red}, ${green}, ${blue})`;
    }

    function buildSharePayload() {
        const rounds = log.map((d, i) => {
            if (!Number.isFinite(d)) return `Round ${i + 1}: ⏭️ Skipped`;
            const diff = d as number;
            let icon = '✅';
            if (diff > 0.5) icon = '⚠️';
            if (diff > 1.5) icon = '❌';
            return `Round ${i + 1}: ${diff.toFixed(1)} ${icon}`;
        }).join('\n');

        const summary = `MovieGame 🎬\nScore: ${score.toFixed(1)}`;
        const text = `${summary}\n\n${rounds}`;
        return { text };
    }

    function getShareText() {
        return buildSharePayload().text;
    }

    function handleCopy() {
        navigator.clipboard.writeText(getShareText()).then(() => setCopied(true));
    }

    function handleX() {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`;
        window.open(url, '_blank');
    }

    function handleWhatsApp() {
        const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`;
        window.open(url, '_blank');
    }

    return (
        <div className={styles.summary}>
            <h1 className="h1">Results</h1>
            <p className={`lead ${styles.leadText}`}>
                {roundsPlayed
                    ? `Average miss of ${avg.toFixed(2)} across ${roundsPlayed} round${roundsPlayed === 1 ? '' : 's'}${skippedRounds ? `, with ${skippedRounds} skip${skippedRounds === 1 ? '' : 's'}` : ''}.`
                    : 'No completed guesses this run - give it another go!'}
            </p>

            <div className={styles.badges}>
                {roundsPlayed > 0 && (
                    <>
                        <span className={styles.badge}><strong>{tightRounds}</strong> tight {(tightRounds === 1 ? 'round' : 'rounds')}{' (<=0.50)'}</span>
                        {bestIndex !== -1 && (
                            <span className={styles.badge}>Closest: R{bestIndex + 1} ({best.toFixed(2)} diff)</span>
                        )}
                        {worstIndex !== -1 && (
                            <span className={styles.badge}>Farthest: R{worstIndex + 1} ({worst.toFixed(2)} diff)</span>
                        )}
                        {skippedRounds > 0 && (
                            <span className={styles.badge}>{skippedRounds} skipped</span>
                        )}
                    </>
                )}
            </div>

            <div className={styles.grid}>
                <div className={styles.stat}><span className={styles.k}>Total</span><span className={styles.v}>{score.toFixed(2)}</span></div>
                <div className={styles.stat}><span className={styles.k}>Average</span><span className={styles.v}>{avg.toFixed(2)}</span></div>
                <div className={styles.stat}><span className={styles.k}>Best</span><span className={styles.v}>{bestIndex === -1 ? '—' : best.toFixed(2)}</span></div>
            </div>

            <section className={styles.chartCard} aria-label="Per-round proximity chart">
                <header className={styles.chartHeader}>
                    <span className={styles.chartTitle}>Round breakdown</span>
                    <span className={styles.chartHint}>Longer, greener bars mean closer guesses</span>
                </header>
                <div className={styles.chart} role="img">
                    {log.map((d, i) => {
                        const val = Number.isFinite(d) ? (d as number) : null;
                        const niceScore = val === null ? null : closeness(val);
                        const backgroundColor = barColor(niceScore);
                        const width = niceScore === null ? 6 : Math.max(6, (niceScore / 10) * 100);
                        const scoreLabel = niceScore === null ? null : niceScore.toFixed(1);
                        const diffLabel = val === null ? null : val.toFixed(2);

                        return (
                            <div key={i} className={styles.row}>
                                <span className={styles.roundLbl}>R{i + 1}</span>
                                <div className={styles.meter} aria-hidden="true">
                                    <div className={styles.bar} style={{ width: `${width}%`, backgroundColor }} />
                                </div>
                                <div className={styles.roundVal}>
                                    {val === null ? (
                                        <span className={styles.roundSkip}>Skipped</span>
                                    ) : (
                                        <>
                                            <span className={styles.roundScore}>{scoreLabel}/10</span>
                                            <span className={styles.roundDiff}>{diffLabel} diff</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className={styles.legend}>
                <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#16a34a' }}></span>
                    <span className={styles.legendText}>Perfect ≤ 0.3</span>
                </span>
                <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }}></span>
                    <span className={styles.legendText}>Good ≤ 1.0</span>
                </span>
                <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }}></span>
                    <span className={styles.legendText}>Off &gt; 1.0</span>
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', alignItems: 'center', marginTop: 'var(--space-5)' }}>
                <span className="label-upper">Share</span>
                <div className={styles.shareRow}>
                    <button className={styles.shareBtn} onClick={handleX} title="Share on Twitter" aria-label="Share on X">𝕏</button>
                    <button className={styles.shareBtn} onClick={handleWhatsApp} title="Share on WhatsApp" aria-label="Share on WhatsApp">💬</button>
                    <button className={styles.shareBtn} onClick={handleCopy} title="Copy result" aria-label="Copy result">{copied ? '✓' : '⎘'}</button>
                </div>
                <div className={styles.actions}>
                    <button className="btnPrimary" onClick={onReplay}>Play Again</button>
                </div>
            </div>
        </div>
    );
}
