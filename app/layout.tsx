import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Movie Game',
    description: 'Movie Game Application',
    icons: {
        icon: [
            { url: '/film.svg', type: 'image/svg+xml' },
        ],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/film.svg" type="image/svg+xml" />
            </head>
            <body>{children}</body>
        </html>
    );
}
