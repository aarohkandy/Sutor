# Sutor

Sutor is a minimal music practice analysis app for violin, viola, and flute. It uses a curated Mutopia catalog for public-domain repertoire, captures a live take in the browser, extracts note and timing data locally, measures basic timbre quality, and then asks a self-hosted Ollama + Gemma setup for a warm written summary.

## Stack

- Next.js 14 App Router
- Tailwind CSS
- GSAP for the intro animation only
- Web Audio API, AudioWorklet, ScriptProcessor fallback
- Browser Web Speech API when available
- `pdfjs-dist@4.6.82` legacy build for score rendering
- Ollama over a user-provided Cloudflare Tunnel URL

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).

## Refresh The Mutopia Catalog

Sutor ships with a baked curated catalog in [data/catalog.json](data/catalog.json). To generate a broader public-domain catalog from a local clone of `MutopiaProject/MutopiaProject`, point the builder at the repo’s `ftp/` tree:

```bash
node scripts/build-mutopia-catalog.mjs --source /path/to/MutopiaProject/ftp --stdout
```

Or write the output to a file:

```bash
node scripts/build-mutopia-catalog.mjs --source /path/to/MutopiaProject/ftp --out data/generated-mutopia-catalog.json
```

The builder parses LilyPond header metadata. It does not scrape Mutopia HTML at runtime.

## Ollama Setup

1. Install Ollama from [ollama.com](https://ollama.com/).
2. Pull Gemma locally:

```bash
ollama pull gemma
```

3. Start Ollama:

```bash
ollama serve
```

4. Make sure Ollama allows your deployment origin. If needed, set `OLLAMA_ORIGINS` to include your local site and deployed domain before starting the server.

## Cloudflare Tunnel

Expose Ollama through Cloudflare Tunnel so Sutor can reach it from the browser.

1. Install `cloudflared`.
2. Start a quick tunnel that forwards to Ollama’s default port:

```bash
cloudflared tunnel --url http://localhost:11434
```

3. Copy the generated HTTPS URL.
4. In Sutor, open `Settings` on the home page and save that tunnel URL as the Ollama URL.

## Deploy To Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Deploy as a standard Next.js app.
4. After deployment, use the home-page settings panel to save your Ollama tunnel URL in the browser you use for practice.

No paid API keys are required.

## Browser Support

- Chrome 90+ and Edge 90+: full experience, including speech commands and best audio support.
- Safari 15+: recording, PDF score rendering, and analysis work; speech support may vary.
- Firefox 88+: recording, score rendering, and analysis work; speech commands are not available and Sutor shows a quiet notice instead.

## Graceful Degradation

- If `AudioWorklet` is unavailable, Sutor falls back to `ScriptProcessorNode` and shows a quiet compatibility notice.
- If speech recognition is unavailable, practice and analysis still work.
- If microphone access is denied, Sutor shows guidance instead of failing silently.
- If Ollama is unreachable, Sutor pauses on the analysis screen and offers a retry flow.

## Tests

Run the current unit suite with:

```bash
npm test
```

The suite covers YIN pitch detection, DTW alignment, MIDI tempo parsing and rest synthesis, the catalog builder, and the core timbre helpers.
