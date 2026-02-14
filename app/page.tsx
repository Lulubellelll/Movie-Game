import GameRoot from '@/components/GameRoot';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Home() {
    return (
        <ErrorBoundary>
            <GameRoot />
        </ErrorBoundary>
    );
}
