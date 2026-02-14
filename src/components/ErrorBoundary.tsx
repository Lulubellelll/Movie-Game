'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Class-based error boundary that catches render errors in its subtree.
 *
 * Accepts an optional fallback render prop to display a custom error UI.
 * If no fallback is provided, renders a default full-screen error message
 * with "Try Again" and "Go to Menu" actions. In development mode, the
 * raw error stack is shown inside a collapsible details element.
 */
export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.resetError);
            }


            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        padding: '2rem',
                        textAlign: 'center',
                        background: 'var(--bg, #000)',
                        color: 'var(--text, #fff)',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '600px',
                            background: 'var(--surface, #1a1a1a)',
                            padding: '2rem',
                            borderRadius: 'var(--radius-3, 12px)',
                            border: '1px solid var(--border, #333)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '3rem',
                                marginBottom: '1rem',
                            }}
                        >
                            😕
                        </div>
                        <h1
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                marginBottom: '1rem',
                            }}
                        >
                            Oops! Something went wrong
                        </h1>
                        <p
                            style={{
                                color: 'var(--muted, #999)',
                                marginBottom: '1.5rem',
                                lineHeight: 1.6,
                            }}
                        >
                            We encountered an unexpected error. Don&apos;t worry, your game
                            progress is safe. Try refreshing the page or going back to the menu.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details
                                style={{
                                    marginBottom: '1.5rem',
                                    textAlign: 'left',
                                    background: 'var(--bg, #000)',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-2, 8px)',
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace',
                                    overflow: 'auto',
                                }}
                            >
                                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                                    Error Details (Development Only)
                                </summary>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {this.state.error.name}: {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.resetError}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    border: 'none',
                                    borderRadius: 'var(--radius-2, 8px)',
                                    cursor: 'pointer',
                                    background: 'var(--text)',
                                    color: '#fff',
                                }}
                                className="btnPrimary"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    border: '1px solid var(--border, #333)',
                                    borderRadius: 'var(--radius-2, 8px)',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                    color: 'var(--text, #fff)',
                                }}
                            >
                                Go to Menu
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
