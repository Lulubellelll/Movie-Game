# Movie Game

A Next.js web application where users guess IMDb ratings by watching movie trailers. Test your movie knowledge and see how well you can predict ratings!

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

<div align="center">
  <video src="public/GameRecoding.mp4" autoplay loop muted playsinline width="100%"></video>
</div>

## How to Play

1. **Select Game Settings**
   - Choose number of rounds (3, 5, 7, or 10)
   - Optionally filter by year range (1900 - present)

2. **Watch & Guess**
   - Watch the movie trailer
   - Use the slider to guess the IMDb rating (0.0 - 10.0)
   - Hold Alt/Option for fine-tuned adjustments (1-point steps)

3. **Review Your Results**
   - See your total error score (lower is better)
   - View detailed statistics and round-by-round breakdown
   - Share your score on social media

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- API keys from:
  - [The Movie Database (TMDB)](https://www.themoviedb.org/settings/api)
  - [OMDb API](https://www.omdbapi.com/apikey.aspx)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd movie-game-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example file and fill in your keys:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local`:

   ```bash
   # TMDB v4 Read Access Token (Recommended)
   TMDB_TOKEN=your_tmdb_v4_read_access_token_here

   # OR TMDB v3 API Key (Fallback)
   TMDB_API_KEY=your_tmdb_v3_api_key_here

   # OMDb API Key (Required)
   OMDB_API_KEY=your_omdb_api_key_here
   ```

   **How to get API keys:**

   - **TMDB Token/Key**:
     1. Sign up at [themoviedb.org](https://www.themoviedb.org/)
     2. Go to Settings > API
     3. Copy your **v4 Read Access Token** (preferred) or **API Key (v3)**

   - **OMDb API Key**:
     1. Visit [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)
     2. Choose the FREE tier (1,000 daily requests)
     3. Verify your email and copy the API key

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
movie-game-next/
├── app/                             # Next.js App Router
│   ├── api/
│   │   └── random-movie/
│   │       └── route.ts             # Movie fetching API endpoint
│   ├── globals.css                  # Global styles & design tokens
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
├── src/
│   ├── api/
│   │   └── tmdb.ts                  # Client-side TMDB API wrapper
│   ├── components/
│   │   ├── ControlsDock/            # Floating controls bar
│   │   ├── ErrorBoundary.tsx        # Error handling wrapper
│   │   ├── GameRoot.tsx             # Main game state manager
│   │   ├── GuessForm/              # Rating input slider
│   │   ├── Header/                 # App header with theme toggle
│   │   ├── ProgressDots/           # Round progress indicator
│   │   ├── SegmentedControl/       # Multi-option selector
│   │   ├── ThemeToggle/            # Light/dark mode toggle
│   │   └── TrailerVideo/           # YouTube video player
│   ├── screens/
│   │   ├── MenuScreen/             # Game setup screen
│   │   ├── RoundScreen/            # Main gameplay screen
│   │   └── SummaryScreen/          # Results & sharing screen
│   └── utils/
│       ├── env.ts                   # Environment variable validation
│       ├── prefetchQueue.ts         # Movie prefetching system
│       ├── rateLimit.ts             # API rate limiting
│       └── random.ts               # Random number utilities
├── public/
│   └── film.svg                     # App logo
├── .env.example                     # Example environment variables
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Create production build
npm start        # Run production server
npm run lint     # Run ESLint
```

## Troubleshooting

### "Server not configured" error

- Verify `.env.local` exists and contains valid API keys
- Restart the development server after adding environment variables
- Check the server console for detailed validation errors

### Movies not loading

- Check your TMDB/OMDb API quotas
- Verify your API keys are correct
- Check browser console for error messages
- Try a different year range (some ranges have fewer movies)

### Rate limit errors

- Wait 60 seconds before trying again
- Check if you're making too many requests
- Consider increasing rate limits in `rateLimit.ts` for local development

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- IMDb ratings from [OMDb API](https://www.omdbapi.com/)
- Trailers hosted on [YouTube](https://www.youtube.com/)

> This product uses the TMDB API but is not endorsed or certified by TMDB.
