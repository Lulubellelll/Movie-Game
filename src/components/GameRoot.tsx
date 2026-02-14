'use client';

import { useEffect, useState } from 'react';
import MenuScreen from '../screens/MenuScreen/MenuScreen';
import RoundScreen from '../screens/RoundScreen/RoundScreen';
import SummaryScreen from '../screens/SummaryScreen/SummaryScreen';
import ControlsDock from '../components/ControlsDock';
import { setPrefetchFilters } from '../utils/prefetchQueue';

type Phase = "menu" | "round" | "summary";

type Theme = 'light' | 'dark';

type StartOptions = {
    rounds: number;
    startYear: number;
    endYear: number;
};

/**
 * Root component that manages the overall game lifecycle.
 *
 * State machine: menu -> round (x N) -> summary -> menu.
 *
 * Theme handling uses a two-phase approach to avoid SSR hydration
 * mismatches: the server always renders with "dark" as the default,
 * then a client-side effect reads the stored preference from
 * localStorage (or the system setting) after hydration completes.
 */
export default function GameRoot() {
    const [phase, setPhase] = useState<Phase>("menu");
    const [round, setRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(5);
    const [score, setScore] = useState(0);
    const [log, setLog] = useState<number[]>([]);
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    const [gameFilters, setGameFilters] = useState<{ startYear: number; endYear: number }>({
        startYear: 1990,
        endYear: new Date().getFullYear(),
    });


    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        const resolved: Theme = storedTheme ?? (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        setTheme(resolved);
        setMounted(true);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        if (mounted) {
            localStorage.setItem('theme', theme);
        }
    }, [theme, mounted]);

    /**
     * Resets all game state and transitions to the round phase.
     * Also configures the prefetch queue with the chosen year range.
     */
    function startGame({ rounds, startYear, endYear }: StartOptions) {
        setGameFilters({ startYear, endYear });
        setPrefetchFilters({ startYear, endYear });
        setRound(0);
        setTotalRounds(rounds);
        setScore(0);
        setLog([]);
        setPhase("round");
    }

    function goToMenu() {
        setPhase("menu");
    }

    /**
     * Accumulates the round's accuracy diff into the total score and
     * round log, then either advances to the next round or ends the game.
     */
    function finishRound(diff: number) {
        setScore(prev => (Number.isFinite(diff) ? prev + diff : prev));
        setLog(prev => [...prev, diff]);
        if (round + 1 === totalRounds) setPhase("summary");
        else setRound(r => r + 1);
    }

    return (
        <>
            <main className="shell">
                <div key={phase} className="card screen">
                    {phase === "menu" && (
                        <MenuScreen
                            onStart={startGame}
                            initialRounds={totalRounds}
                            initialStartYear={gameFilters.startYear}
                            initialEndYear={gameFilters.endYear}
                        />
                    )}
                    {phase === "round" && (
                        <RoundScreen
                            key={round}
                            round={round + 1}
                            total={totalRounds}
                            onFinish={finishRound}
                        />
                    )}
                    {phase === "summary" && (
                        <SummaryScreen log={log} score={score} onReplay={goToMenu} />
                    )}
                </div>
            </main>
            {phase !== 'round' && (
                <ControlsDock
                    theme={theme}
                    onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                />
            )}
        </>
    );
}
