import { useState, useEffect, useRef } from "react";
import styles from "./TrailerVideo.module.css"

type TrailerVideoProps = {
    title: string;
    url: string;
    onUnavailable?: () => void;
}

/**
 * Embeds a YouTube trailer in an iframe with autoplay and muted audio.
 *
 * Extracts the video ID from the embed URL and validates it before
 * rendering. If the URL is invalid or the iframe fails to load, the
 * component notifies the parent via onUnavailable so the parent can
 * request a different movie from the prefetch queue. A ref guard
 * ensures the callback fires at most once per mount.
 */
export default function TrailerVideo({ title, url, onUnavailable }: TrailerVideoProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const notifiedRef = useRef(false);




    const getVideoId = (url: string) => {
        const match = url.match(/\/embed\/([^?]+)/);
        return match ? match[1] : null;
    };

    const videoId = getVideoId(url);


    useEffect(() => {
        if ((!videoId || !url) && !notifiedRef.current) {
            notifiedRef.current = true;
            onUnavailable?.();
        }
    }, [videoId, url, onUnavailable]);

    if (!videoId || !url) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <div className={styles.errorIcon}>🎬</div>
                    <div className={styles.errorText}>No trailer available</div>
                </div>
            </div>
        );
    }


    const iframeUrl = `${url}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0&enablejsapi=1&origin=${window.location.origin}`;

    if (hasError) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <div className={styles.errorText}>Trailer unavailable</div>
                    <button
                        className={styles.retryBtn}
                        onClick={() => {
                            setHasError(false);
                            setIsLoading(true);
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {isLoading && (
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                    <div className={styles.loadingText}>Loading trailer...</div>
                </div>
            )}
            <iframe
                width="720"
                height="405"
                src={iframeUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setHasError(true);
                    setIsLoading(false);
                    if (!notifiedRef.current) {
                        notifiedRef.current = true;
                        onUnavailable?.();
                    }
                }}
                style={{ display: isLoading ? 'none' : 'block' }}
            />
        </div>
    );

}
