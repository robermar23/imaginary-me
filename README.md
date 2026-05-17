# imaginary me

**Reimagine yourself in infinite worlds.**

Users answer a short survey about their interests (movies, books, TV shows, superpowers, dream destinations), upload 1–3 profile photos, and receive a personalized gallery of AI-generated images placing them into worlds drawn from their answers.

- No account required — anonymous ephemeral sessions only
- Photos are never persisted — Vercel Blob TTLs + explicit cleanup
- Mobile-first, dark-only UI

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router |
| Styling | Tailwind v4 + shadcn/ui (base-ui) |
| State | Zustand (sessionStorage-backed) |
| AI image providers | OpenAI gpt-image-1 · Google Imagen 3 · Stability AI SDXL |
| Prompt engineering | Claude claude-opus-4-7 as creative director |
| Storage | Vercel Blob (1 hr TTL for uploads, 24 hr for generated images) |
| Deployment | Vercel |

---

## Local development

### Prerequisites

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/) (always required — powers prompt generation)
- At least one image provider key (see below), **or** leave them all unset to use the mock provider (returns picsum placeholder images)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values you need:

```bash
# Required — Claude generates image concepts from survey data
ANTHROPIC_API_KEY=sk-ant-...

# Pick one image provider (or leave all blank for mock mode)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Optional — photos and generated images are stored here.
# Without this token, uploads fall back to in-memory data URLs
# so the full UI still works but images are not persisted.
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

See [`.env.example`](.env.example) for all variables including Gemini, Stability AI, and Vercel KV.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mock mode (no API keys needed)

If you omit both the provider key (`OPENAI_API_KEY` / `GEMINI_API_KEY` / `STABILITY_API_KEY`) and `ANTHROPIC_API_KEY`, the app runs in full mock mode:

- **Prompt engine** returns pre-written placeholder concepts (no Claude call)
- **Image provider** returns random [picsum.photos](https://picsum.photos) images (no AI call)
- **Upload** echoes files as data URLs (no Vercel Blob call)

The entire UI flow works end-to-end. Mock mode is the default for CI and first-time setup.

---

## Running tests

### Unit tests (Vitest)

```bash
npm test
```

Runs 36 unit tests covering Zod schemas and the PromptEngine. No API keys or running server needed.

```bash
npm run test:watch   # watch mode during development
```

### E2E tests (Playwright)

Install browsers once:

```bash
npx playwright install
```

Then start the dev server and run:

```bash
npm run test:e2e
```

Or let Playwright manage the server automatically (it starts `npm run dev` on port 3000 if nothing is already listening):

```bash
npm run test:e2e -- --project=chromium
```

E2E tests cover landing page, survey wizard, photo upload, generation settings, mobile viewport, navigation, and the results edit flow.

---

## Project structure

```text
app/
  page.tsx                  Landing page (Server Component)
  create/page.tsx           Full creation flow shell
  error.tsx                 React error boundary
  not-found.tsx             404 page
  api/
    upload/route.ts         POST — photo upload → Vercel Blob
    generate/route.ts       POST — SSE stream, AI image generation
    regenerate/route.ts     POST — SSE stream, single-image regen
    cleanup/route.ts        POST — delete session blobs

components/
  landing/                  HeroSection, ExampleGallery
  survey/                   SurveyWizard, step components, tag inputs
  upload/                   DropZone, PhotoThumbnail, PhotoUpload
  generation/               GenerationSettings, ConceptPreview, GenerateButton
  loading/                  GenerationLoading, ImageSkeleton, StatusMessage
  results/                  ResultsGallery, ImageCard, ImageActions,
                            PromptViewer, DownloadAllButton, SessionActions
  layout/                   AppShell, StepProgress
  CreateFlow.tsx            Step router with AnimatePresence transitions

lib/
  ai/
    prompt-engine.ts        SurveyData → ImageConcept[] via Claude
    providers/              openai.ts · gemini.ts · stability.ts
    factory.ts              createImageProvider() from env config
  validation/schemas.ts     Zod schemas (shared client + server)

store/session.ts            Zustand store — survey, photos, generated images
hooks/                      useSurvey, usePhotoUpload, useGeneration
config/ai-config.ts         Provider config from env vars
types/index.ts              Shared TypeScript types

tests/
  unit/                     schemas.test.ts · prompt-engine.test.ts
  e2e/                      happy-path.spec.ts · mobile.spec.ts · edit-flow.spec.ts
```

---

## Deploying to Vercel

### 1. Push to GitHub and import the repo

Create a new Vercel project from your GitHub repo. Vercel detects Next.js automatically.

### 2. Attach a Blob store

In your Vercel project dashboard: **Storage → Create → Blob**. Once created, Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into your deployment environment.

### 3. Set environment variables

In **Settings → Environment Variables**, add:

| Variable | Required | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Always | Claude prompt generation |
| `AI_PROVIDER` | Always | `openai` \| `gemini` \| `stability` |
| `OPENAI_API_KEY` | If provider=openai | |
| `GEMINI_API_KEY` | If provider=gemini | |
| `STABILITY_API_KEY` | If provider=stability | |
| `BLOB_READ_WRITE_TOKEN` | Auto-set | Injected by Blob store integration |
| `KV_*` | Optional | Distributed rate limiting (Vercel KV) |

### 4. Deploy

Vercel builds and deploys on every push to `main`. The build command is `npm run build` and the output directory is `.next` (both detected automatically).

### Rate limiting note

Without Vercel KV, rate limiting is in-process and resets on cold starts. This is fine for low-traffic deployments. To add persistent rate limiting, create a **KV store** in the Vercel dashboard and connect it — the env vars are injected automatically.

---

## Adding real example images

The landing page gallery uses gradient placeholder cards by default. To replace them with real images:

1. Generate 3 images using the app (or any source)
2. Place them as `public/example-1.jpg`, `public/example-2.jpg`, `public/example-3.jpg`
3. In [`components/landing/ExampleGallery.tsx`](components/landing/ExampleGallery.tsx), update the `src` fields:

```ts
const EXAMPLES = [
  { src: '/example-1.jpg', label: 'Dune + Japan', ... },
  { src: '/example-2.jpg', label: 'Harry Potter + Iceland + Dark', ... },
  { src: '/example-3.jpg', label: 'Avatar + Teleportation', ... },
]
```

---

## Key design decisions

**No auth, no database.** All state lives in browser sessionStorage (Zustand) and Vercel Blob with TTLs. The session ID is a UUID generated client-side on first visit.

**Claude as creative director.** Rather than sending survey data directly to the image API, Claude (`claude-opus-4-7`) converts interests into vivid scene concepts with provider-specific prompt formatting. This handles niche references, cross-category combinations, and aesthetic constraints much better than prompt templates.

**SSE from POST.** Both `/api/generate` and `/api/regenerate` return `text/event-stream` directly from the POST response body. No separate GET stream endpoint is needed.

**Provider swap via env var.** Change `AI_PROVIDER` to switch between OpenAI, Gemini, and Stability AI with no code changes. Missing keys automatically fall back to the mock provider so nothing crashes.
