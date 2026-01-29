# Album Cover Pub Quiz (70s & 80s)

Small React + TypeScript quiz app for practicing classic album covers. Users enter album title, artist, release year, and a few tracks. Partial credit is shown, and a goofy confetti burst appears when they nail multiple attributes.

## Run the app

```bash
npm install
npm run dev
```

Then open the URL Vite prints in the terminal.

## Build for production

```bash
npm run build
npm run preview
```

## Customizing the quiz

All data lives in `src/data/albums.ts`. Add/remove albums or swap out image URLs.

The current image URLs point to Wikipedia-hosted cover art. If you prefer local files, add them to `public/covers/` and update each album's `coverUrl` to something like `/covers/your-cover.jpg`.
