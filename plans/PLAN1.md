# imaginary-me — Full Implementation Plan

**Version:** 1.0  
**Date:** 2026-05-12  
**Status:** Draft — Ready for Development

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [Technical Architecture](#2-technical-architecture)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [System Design](#4-system-design)
5. [UI/UX Design](#5-uiux-design)
6. [Survey Design & Content Strategy](#6-survey-design--content-strategy)
7. [AI Image Generation Pipeline](#7-ai-image-generation-pipeline)
8. [Prompt Engineering](#8-prompt-engineering)
9. [API Route Design](#9-api-route-design)
10. [Data Models & Types](#10-data-models--types)
11. [Component Architecture](#11-component-architecture)
12. [State Management](#12-state-management)
13. [Implementation Phases](#13-implementation-phases)
14. [Configuration & Environment Variables](#14-configuration--environment-variables)
15. [Security Considerations](#15-security-considerations)
16. [Performance Strategy](#16-performance-strategy)
17. [Testing Strategy](#17-testing-strategy)
18. [Phase 2 Roadmap — Audio](#18-phase-2-roadmap--audio)
19. [Risks & Mitigations](#19-risks--mitigations)

---

## 1. Overview & Goals

**imaginary-me** is a web application that reimagines who you could be. Users answer a short survey about their interests (movies, books, TV shows, superpowers, dream destinations), upload 1–3 profile photos, and receive a personalized gallery of AI-generated images placing them into worlds drawn from their answers — e.g., a Dune Fremen, a time-travelling Japanophile, or a wizard above a city skyline.

### Core Requirements (from FEATURE.md)

| # | Requirement | Priority |
|---|---|---|
| 1 | Multi-topic interest survey (movies, books, TV, superpowers, places) | P0 |
| 2 | Profile photo upload (multiple allowed) | P0 |
| 3 | AI-generated images blending survey data + profile photos | P0 |
| 4 | Simple to use; any parameter easy to change | P0 |
| 5 | AI provider is app config (not user-facing) | P0 |
| 6 | No photos ever persisted; download only | P0 |
| 7 | Mobile-friendly | P0 |
| 8 | Sound/voiceover overlays based on interests | P2 (Phase 2) |

### Key Decisions (confirmed by user)

- **Framework:** Next.js 15 (App Router, full-stack)
- **Deployment:** Vercel
- **Image AI:** All providers configurable — OpenAI, Google Imagen, Stability AI
- **Auth:** None — anonymous ephemeral sessions only
- **Image Count:** Configurable 1–8 per session
- **Photo Storage:** Temporary server-side (Vercel Blob, TTL 1 hour)
- **Audio:** Phase 2 only

---

## 2. Technical Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Survey     │  │  Photo      │  │  Results Gallery    │ │
│  │  Wizard     │  │  Upload     │  │  (Download/View)    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                    Zustand Store                             │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                  Next.js API Routes (Vercel)                 │
│                                                              │
│  POST /api/upload    POST /api/generate    POST /api/cleanup │
│       │                    │                      │          │
│  Vercel Blob          PromptEngine            Vercel Blob    │
│  (temp store)         + Provider               (delete)      │
│                       Adapter                               │
└──────────────────────────────┬──────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼───────┐   ┌─────────▼──────┐   ┌─────────▼───────┐
│ OpenAI API     │   │ Google Gemini  │   │ Stability AI    │
│ gpt-image-1    │   │ Imagen 3       │   │ SD3 / SDXL      │
│ (img2img edit) │   │ (text→image)   │   │ (img2img)       │
└────────────────┘   └────────────────┘   └─────────────────┘
         │
┌────────▼────────────────────┐
│ Anthropic Claude API        │
│ claude-opus-4-7             │
│ (Prompt Engineering Layer)  │
└─────────────────────────────┘
```

### Data Flow (Happy Path)

```
1. User fills survey  →  stored in Zustand
2. User uploads photos  →  POST /api/upload  →  Vercel Blob (1hr TTL)
                          returns [blobUrls]  →  stored in Zustand
3. User clicks Generate:
   a. POST /api/generate {surveyData, blobUrls, count, sessionId}
   b. PromptEngine calls Claude to generate N creative concepts
   c. Provider Adapter calls image API with each concept + reference photos
   d. Results stream back via SSE (Server-Sent Events)
   e. Generated images stored in Vercel Blob (24hr TTL)
   f. URLs returned to client
4. User views gallery  →  images displayed from Blob URLs
5. User downloads  →  direct download from Blob URL
6. User leaves / resets  →  POST /api/cleanup  →  Blobs deleted immediately
   (also: Vercel Blob TTLs expire any orphaned files)
```

---

## 3. Tech Stack & Dependencies

### Core

| Package | Version | Purpose |
|---|---|---|
| `next` | 15.x | Full-stack framework |
| `react` | 19.x | UI library |
| `typescript` | 5.x | Type safety |
| `tailwindcss` | 4.x | Utility-first CSS |
| `shadcn/ui` | latest | Component primitives |

### State & Forms

| Package | Purpose |
|---|---|
| `zustand` | Global session state (survey, photos, results) |
| `react-hook-form` | Survey form management |
| `zod` | Schema validation (shared client/server) |

### AI & Storage

| Package | Purpose |
|---|---|
| `openai` | OpenAI SDK (gpt-image-1, image edits) |
| `@google/generative-ai` | Gemini SDK (Imagen 3) |
| `@vercel/blob` | Temporary photo and result storage |
| `@anthropic-ai/sdk` | Claude SDK for prompt engineering |

### UI & UX

| Package | Purpose |
|---|---|
| `framer-motion` | Page transitions, card animations |
| `react-dropzone` | Drag-and-drop photo upload |
| `lucide-react` | Icon library (consistent with shadcn) |
| `react-hot-toast` | Toast notifications |
| `@radix-ui/react-progress` | Progress bar (via shadcn) |
| `@radix-ui/react-slider` | Image count slider (via shadcn) |

### Dev & Quality

| Package | Purpose |
|---|---|
| `eslint` + `eslint-config-next` | Linting |
| `prettier` | Code formatting |
| `vitest` | Unit tests |
| `@testing-library/react` | Component tests |
| `playwright` | E2E tests |

---

## 4. System Design

### Session Model

No database. All state is ephemeral by design:

| Layer | What's stored | Lifetime |
|---|---|---|
| Zustand (browser) | Survey answers, photo previews (base64), generated image URLs, sessionId | Tab lifetime |
| `sessionStorage` | sessionId (UUID v4) | Tab lifetime |
| Vercel Blob (server) | Uploaded profile photos (original bytes) | 1 hour TTL |
| Vercel Blob (server) | Generated images | 24 hour TTL |

**sessionId** is generated client-side as a UUID v4 on first visit, stored in `sessionStorage`. All Vercel Blob objects are tagged with this session ID prefix (`session/{id}/...`) enabling cleanup by prefix.

### Cleanup Strategy (No Persistent Data Guarantee)

```typescript
// Three-layer cleanup:
// 1. Active cleanup: user clicks "Start Over" or closes tab (beforeunload)
// 2. TTL cleanup: Vercel Blob auto-expires (1hr uploads, 24hr generated)
// 3. Admin safety: Cron job deletes blobs older than 48hrs (failsafe)
```

### AI Provider Adapter Pattern

All image providers implement a single interface, enabling swap-in-place at config time:

```typescript
interface ImageProvider {
  name: string
  generateImages(request: GenerationRequest): Promise<GenerationResult[]>
  supportsImageInput: boolean   // can it use the profile photo directly?
  maxImagesPerCall: number
}

interface GenerationRequest {
  prompt: string
  referenceImageUrl?: string   // profile photo blob URL
  style: ImageStyle
  size: ImageSize
}

interface GenerationResult {
  imageUrl: string             // generated image URL (Vercel Blob)
  conceptTitle: string
  promptUsed: string
  provider: string
}
```

### Streaming Progress

Image generation is slow (10–30s per image). Use **Server-Sent Events** to stream progress:

```
POST /api/generate → initiates generation
GET  /api/generate/stream?sessionId=xxx → SSE stream

Events:
  { type: 'concept', index: 0, title: 'Fremen Warrior of Arrakis' }
  { type: 'progress', index: 0, status: 'generating' }
  { type: 'complete', index: 0, imageUrl: 'https://...' }
  { type: 'error', index: 0, message: '...' }
  { type: 'done', total: 6 }
```

Generation runs in parallel (Promise.all with concurrency limit of 3) to minimize total wait time.

---

## 5. UI/UX Design

### Design Philosophy

- **Mobile-first**: Design at 375px, scale up
- **Dark theme default**: Feels immersive and cinematic
- **Progressive disclosure**: One decision at a time — no information overload
- **Delight in motion**: Subtle animations reward interactions
- **Immediate editability**: Every step can be revisited without losing other data

### Color System

```css
/* Primary palette — deep space with electric accents */
--background:     #0a0a0f;   /* near-black */
--surface:        #12121a;   /* card backgrounds */
--surface-raised: #1a1a28;   /* elevated surfaces */
--border:         #2a2a3d;   /* subtle borders */
--accent-1:       #6c47ff;   /* electric violet */
--accent-2:       #00d4ff;   /* cyan */
--accent-gradient: linear-gradient(135deg, #6c47ff, #00d4ff);
--text-primary:   #f0f0f8;
--text-secondary: #8888aa;
--success:        #00c27a;
--error:          #ff4455;
```

### Application Flow

```
[Landing Page]
     │
     ▼ Click "Start Creating"
[Survey — Step 1: Entertainment]
  Movies / Books / TV Shows (tag inputs, autocomplete)
     │
     ▼ Next
[Survey — Step 2: Dreams]
  Superpower / Places / Genre prefs
     │
     ▼ Next  
[Survey — Step 3: Aesthetic]
  Style preferences (visual card selects)
     │
     ▼ Next
[Photo Upload]
  Drag & drop / tap, 1–3 photos, preview strip
     │
     ▼ Next
[Generation Settings]
  Count slider (1–8), optional concept preview
     │
     ▼ Click "Reimagine Me"
[Loading / Generation]
  Cards appear one by one as each generates
     │
     ▼ Complete
[Results Gallery]
  Grid of images, download/regenerate per image, download all
     │
     ├── "Adjust Interests" → back to survey (keeps photos)
     ├── "New Photos" → back to upload (keeps survey)
     └── "Start Over" → reset everything
```

### Screen Designs

#### Landing Page
```
┌─────────────────────────────────┐
│  ✦ imaginary me                 │  ← Logo mark + wordmark
│                                 │
│  Reimagine yourself             │
│  in infinite worlds             │  ← Hero headline (large, gradient)
│                                 │
│  [3 example images — carousel]  │  ← Proof-of-concept images
│                                 │
│  ┌─────────────────────────┐   │
│  │   Start Creating  →     │   │  ← Primary CTA button
│  └─────────────────────────┘   │
│                                 │
│  No sign up. No storage.        │
│  Your photos stay private.      │  ← Trust signals
└─────────────────────────────────┘
```

#### Survey Step (Mobile)
```
┌─────────────────────────────────┐
│  ●●●○○  Step 1 of 3            │  ← Progress dots
│                                 │
│  What movies do you love?       │  ← Question
│  Add up to 5 favorites          │  ← Subtext
│                                 │
│  ┌───────────────────────────┐ │
│  │ Type a movie...        🔍 │ │  ← Tag input with autocomplete
│  └───────────────────────────┘ │
│  [Dune ×] [Inception ×]        │  ← Tag chips (removable)
│  [The Matrix ×]                │
│                                 │
│  Popular picks:                 │
│  [Interstellar] [Avatar] [...]  │  ← Quick-add suggestions
│                                 │
│        ─────────────────        │
│                                 │
│  What books do you love?        │
│  ┌───────────────────────────┐ │
│  │ Type a book...         🔍 │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌─────────────┐ ┌──────────┐  │
│  │    Back     │ │  Next →  │  │  ← Navigation
│  └─────────────┘ └──────────┘  │
└─────────────────────────────────┘
```

#### Photo Upload (Mobile)
```
┌─────────────────────────────────┐
│  Upload your photos             │
│  We'll place you in your worlds │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │      📷                 │   │
│  │  Tap to upload          │   │  ← Drop zone
│  │  or drag photos here    │   │
│  │                         │   │
│  │  JPG, PNG, WebP — 10MB  │   │
│  └─────────────────────────┘   │
│                                 │
│  [Photo 1] [Photo 2] [+ Add]   │  ← Thumbnail strip
│                                 │
│  💡 Tip: Clear, front-facing   │
│  photos give the best results  │
│                                 │
│  ┌─────────────┐ ┌──────────┐  │
│  │    Back     │ │  Next →  │  │
│  └─────────────┘ └──────────┘  │
└─────────────────────────────────┘
```

#### Generation Settings (Mobile)
```
┌─────────────────────────────────┐
│  Ready to reimagine you?        │
│                                 │
│  How many images?               │
│  ──────────────────────────     │
│  ○─────────●──────────○  6     │  ← Slider (1–8)
│  1                      8      │
│                                 │
│  Your themes will include:      │
│  ┌─────────────────────────┐   │
│  │ ✦ Dune universe         │   │
│  │ ✦ Japan adventure       │   │  ← Concept preview
│  │ ✦ Teleportation powers  │   │
│  │ ✦ ...and 3 more         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   ✨ Reimagine Me       │   │  ← Primary generate CTA
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

#### Loading Screen
```
┌─────────────────────────────────┐
│  Creating your worlds...        │
│                                 │
│  ┌───────┐ ┌───────┐ ┌───────┐ │
│  │░░░░░░░│ │▓▓▓▓░░░│ │███████│ │  ← Animated shimmer cards
│  │░░░░░░░│ │▓▓▓▓░░░│ │  ✓   │ │     (gray → revealing → done)
│  └───────┘ └───────┘ └───────┘ │
│  ┌───────┐ ┌───────┐ ┌───────┐ │
│  │░░░░░░░│ │░░░░░░░│ │░░░░░░░│ │
│  │░░░░░░░│ │░░░░░░░│ │░░░░░░░│ │
│  └───────┘ └───────┘ └───────┘ │
│                                 │
│  Placing you in the             │
│  Dune universe... ✨            │  ← Animated status text
│                                 │
│  Image 3 of 6                   │  ← Count
│  ████████████░░░░  50%          │  ← Progress bar
└─────────────────────────────────┘
```

#### Results Gallery (Mobile)
```
┌─────────────────────────────────┐
│  Your worlds await ✦            │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │          │  │          │    │
│  │  [img1]  │  │  [img2]  │    │  ← 2-column grid (mobile)
│  │          │  │          │    │
│  │ ⬇  🔄 ℹ │  │ ⬇  🔄 ℹ │    │  ← Per-image actions
│  └──────────┘  └──────────┘    │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │  [img3]  │  │  [img4]  │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  ┌─────────────────────────┐   │
│  │    ⬇ Download All       │   │
│  └─────────────────────────┘   │
│                                 │
│  [Adjust Interests] [New Photos]│
│  [Start Over]                   │
└─────────────────────────────────┘
```

#### Results Gallery (Desktop — 3–4 columns)
Images scale to 3 columns on tablet (768px+) and 4 columns on desktop (1280px+).

### Responsive Breakpoints

| Breakpoint | Columns | Changes |
|---|---|---|
| 375px (mobile) | 2 | Stacked navigation, bottom actions |
| 768px (tablet) | 3 | Side navigation, inline actions |
| 1280px (desktop) | 4 | Full sidebar, hover states |

---

## 6. Survey Design & Content Strategy

### Survey Principles

1. **Short and delightful** — never feel like a form, feel like a conversation
2. **Optional fields** — users can skip any section with graceful fallback themes
3. **Smart defaults** — autocomplete popular items to reduce friction
4. **Visual feedback** — tags appear immediately, providing satisfaction
5. **Gamified framing** — "What worlds do you belong in?" not "Enter preferences"

### Survey Structure

#### Step 1: Entertainment Worlds
```
"What stories live in your head rent-free?"

Fields:
  - Favorite Movies (0–5 tags, autocomplete from TMDB-seeded list)
  - Favorite Books (0–5 tags, autocomplete from Open Library / manual)
  - Favorite TV Shows (0–5 tags, autocomplete from TMDB / manual)

Quick-picks (pre-populated chips to click):
  Movies: Dune, Interstellar, Avatar, The Matrix, Lord of the Rings, Oppenheimer
  Books:  Dune, LOTR, Harry Potter, 1984, The Witcher, Ender's Game
  Shows:  Game of Thrones, Breaking Bad, Stranger Things, The Last of Us, Arcane
```

#### Step 2: Dreams & Powers
```
"If the rules didn't apply..."

Fields:
  - Superpower you wish you had (free text, max 100 chars, with suggestions)
    Suggestions: Teleportation, Flight, Time travel, Telepathy, Invisibility,
                 Healing, Shapeshifting, Elemental control, Super strength
  - Places you dream of visiting (0–5 tags)
    Quick-picks: Japan, Iceland, Patagonia, Morocco, New Zealand, Egypt, Maldives
  - Time period preference (single select, optional)
    Options: Ancient world, Medieval, Renaissance, Victorian, Modern, Far future
```

#### Step 3: Visual Aesthetic
```
"How does your imagination look?"

Fields (visual card selects, each with a small example image):
  - Mood (pick 1–2):
    [Cinematic & Epic] [Dreamy & Soft] [Dark & Mysterious]
    [Vibrant & Colorful] [Gritty & Realistic] [Fantastical & Surreal]
  
  - Art style preference (pick 1):
    [Photorealistic] [Painted / Illustrated] [Anime/Manga] [Concept Art]
    [No preference — surprise me]
```

### Survey Data Schema (Zod)

```typescript
const SurveySchema = z.object({
  movies:       z.array(z.string().max(100)).max(5).default([]),
  books:        z.array(z.string().max(100)).max(5).default([]),
  tvShows:      z.array(z.string().max(100)).max(5).default([]),
  superpower:   z.string().max(100).optional(),
  places:       z.array(z.string().max(100)).max(5).default([]),
  timePeriod:   z.enum(['ancient','medieval','renaissance','victorian','modern','future']).optional(),
  moods:        z.array(z.enum(['cinematic','dreamy','dark','vibrant','gritty','surreal'])).max(2).default([]),
  artStyle:     z.enum(['photorealistic','painted','anime','concept_art','surprise']).default('surprise'),
})
```

### Fallback Handling

If a section is empty, the PromptEngine falls back gracefully:
- No movies → use books/shows for all entertainment themes
- No everything → generate generic "adventure/fantasy world" themes
- Minimum 1 source of inspiration required before allowing generation

### Content Moderation Pre-processing

Before passing survey data to the prompt engine, a lightweight filter:
1. Check against a blocklist of known problematic franchises (adult content, extreme violence)
2. Flag ambiguous entries for safe interpretation (e.g., "Dexter" → interpreted as scientist, not killer)
3. No user-visible filter — just silently substitute or skip flagged content

---

## 7. AI Image Generation Pipeline

### Provider Capabilities Matrix

| Feature | OpenAI gpt-image-1 | Google Imagen 3 | Stability AI SD3 |
|---|---|---|---|
| Text-to-image | ✅ | ✅ | ✅ |
| Image-to-image (face reference) | ✅ via edits API | ❌ direct | ✅ img2img |
| Quality tier | Very High | Very High | High |
| Speed | Medium (8–20s) | Medium (10–25s) | Fast (5–15s) |
| Cost | $0.04–$0.12/img | $0.02–$0.08/img | $0.002–$0.02/img |
| Face consistency | Good (edit mode) | Moderate (prompt) | Good (img2img) |
| Content policy | Moderate | Strict | Permissive |

### Face Consistency Strategy (Critical)

The most technically challenging requirement is placing the user's actual face/appearance into generated scenes. Strategy per provider:

**OpenAI (gpt-image-1):**
- Use the `/v1/images/edits` endpoint with the profile photo as `image`
- The model can generate variations that maintain facial characteristics
- Prompt includes: "Transform this person into [character], maintaining their facial features, skin tone, and identity"
- If user uploaded multiple photos, select the clearest one (highest resolution, most frontal)

**Stability AI:**
- Use `img2img` endpoint with the profile photo as `init_image`
- Set `image_strength` = 0.65 (creative transformation while preserving identity)
- Use SDXL model with face restoration (CodeFormer post-processing)

**Google Imagen 3:**
- No direct image input support in standard API tier
- Workaround: Use Gemini 2.0 Flash to analyze the profile photo and generate a detailed appearance description
- Inject description into Imagen prompt: "A [age]-[gender] person with [hair color], [eye color], [skin tone], [distinctive features] as a [character]..."
- Result: Lower face accuracy but still highly personalized

### Provider Selection Logic

```typescript
// config/ai-config.ts
const AI_PROVIDER = process.env.AI_PROVIDER as 'openai' | 'gemini' | 'stability'

// Provider priority for face-consistency (if not configured):
// openai > stability > gemini
// Provider priority for cost:
// stability > gemini > openai
```

### Image Size Strategy

All providers target `1024x1024` square images (ideal for profile-style images). On desktop results, CSS `object-fit: cover` handles cropping for any non-square display.

### Generation Concurrency

```typescript
const CONCURRENCY_LIMIT = 3  // run 3 generations in parallel max
// Total time for 6 images: ~30s (sequential) → ~12s (parallel-3)
```

---

## 8. Prompt Engineering

### Architecture: Claude as Creative Director

The prompt engine uses two AI calls per image:

1. **Claude call** (text): Survey data → rich creative concept  
2. **Image API call**: Creative concept → actual image

This two-step approach ensures:
- Obscure or niche interests are handled creatively (Claude understands context)
- Prompts are optimized for each image provider's strengths
- Combinations are unique and thematically coherent

### PromptEngine Class Design

```typescript
// lib/ai/prompt-engine.ts

export class PromptEngine {
  constructor(private claudeClient: Anthropic) {}

  async generateConcepts(
    survey: SurveyData,
    count: number,
    provider: ImageProviderName
  ): Promise<ImageConcept[]>

  private selectThemeCombinations(
    survey: SurveyData,
    count: number
  ): ThemeCombination[]

  private async conceptFromThemes(
    combo: ThemeCombination,
    survey: SurveyData,
    provider: ImageProviderName
  ): Promise<ImageConcept>
}
```

### Theme Selection Algorithm

For N images, select N unique theme combinations:

```typescript
interface ThemeCombination {
  primary: string     // e.g., "Dune (book)"
  secondary?: string  // e.g., "Japan (place)"
  modifier?: string   // e.g., "teleportation (superpower)"
}
```

Rules:
1. Each source (movies, books, places, etc.) contributes at most `ceil(N/sources)` combos
2. Prefer cross-category combinations (movie + place > movie + movie)
3. Use the superpower in at least one image if provided
4. Use a dream place in at least one image if provided
5. Apply the aesthetic mood to all prompts as a style suffix

### Claude System Prompt for Concept Generation

```
You are a creative director for an AI portrait studio that reimagines people 
in fantastical settings based on their interests.

Given a user's interests and a theme combination, create a vivid, specific 
image concept that:
- Transforms the subject person into a character/version that fits the theme
- Combines multiple interests in a surprising, delightful way  
- Results in a portrait-oriented image (person is the clear subject)
- Is optimized for [PROVIDER] image generation
- Adheres to safe content guidelines

Respond with JSON:
{
  "title": "Short evocative title (e.g., 'Fremen Warrior of Arrakis')",
  "concept": "2-3 sentence description of the scene",
  "imagePrompt": "Detailed image generation prompt, comma-separated descriptors, style tags",
  "negativePrompt": "Things to avoid (for providers that support it)"
}
```

### Example Prompt Generations

**Input:** Movies: [Dune], Superpower: [Teleportation], Place: [Japan]  
**Theme combo selected:** Dune + Japan  
**Claude output:**
```json
{
  "title": "Sand-Walker of the Eastern Dunes",
  "concept": "A Fremen warrior who has mastered an ancient form of space-folding that allows instantaneous movement across Arrakis. Their stillsuit bears the subtle markings of a distant eastern culture, and their blue eyes glow faintly with spice-sight.",
  "imagePrompt": "photorealistic portrait, person as a Fremen warrior from Dune, stillsuit with Japanese kanji-inscribed panels, glowing blue eyes, desert of Arrakis backdrop, sand dunes at golden hour, cinematic lighting, 8K resolution, detailed fabric texture",
  "negativePrompt": "cartoon, anime, blurry, low quality, multiple people"
}
```

**Input:** Books: [Harry Potter], Place: [Iceland], Mood: [dark, surreal]  
**Claude output:**
```json
{
  "title": "Northern Wanderer",
  "concept": "A battle-worn wizard standing at the edge of an Icelandic volcanic plain under the aurora borealis. Their robes, tattered from years of dark magic battles, whip in a glacial wind.",
  "imagePrompt": "cinematic dark fantasy portrait, person as a battle-hardened wizard, ancient robes, magical aura, Iceland volcanic landscape background, aurora borealis sky, dramatic moody lighting, surreal atmosphere, detailed texture, film grain",
  "negativePrompt": "cartoonish, bright colors, childlike"
}
```

### Style Application

Survey aesthetic choices are appended to all prompts as a suffix block:

```typescript
const MOOD_DESCRIPTORS = {
  cinematic: 'cinematic lighting, dramatic composition, film grain, widescreen',
  dreamy:    'soft focus, pastel tones, ethereal light, bokeh, painterly',
  dark:      'dark atmosphere, moody lighting, deep shadows, noir aesthetic',
  vibrant:   'vivid colors, high saturation, dynamic energy, bold palette',
  gritty:    'gritty realism, weathered textures, harsh lighting, documentary style',
  surreal:   'surreal dreamlike quality, impossible geometry, metaphysical atmosphere',
}

const ART_STYLE_DESCRIPTORS = {
  photorealistic: 'ultra-realistic, photographic, 8K, DSLR quality',
  painted:        'oil painting style, brushstrokes visible, Renaissance portrait',
  anime:          'anime art style, Studio Ghibli influence, cel shading',
  concept_art:    'concept art, ArtStation trending, digital painting, matte painting',
  surprise:       '',  // let Claude choose
}
```

---

## 9. API Route Design

### POST /api/upload

Accepts profile photos, stores temporarily, returns blob URLs.

```typescript
// Request: multipart/form-data
// Fields: photos[] (File[]), sessionId (string)

// Response:
{
  uploads: [
    { id: string, url: string, size: number }
  ]
}

// Validations:
// - Max 3 files
// - Max 10MB each
// - MIME: image/jpeg | image/png | image/webp
// - Client-side resize to max 1024px before send (see PhotoUpload component)
// - Server-side: magic bytes validation (not just MIME header)

// Storage: PUT to Vercel Blob at key `session/{sessionId}/photo-{n}-{uuid}.jpg`
// TTL: 1 hour (set via blob metadata)
```

### POST /api/generate

Triggers image generation. Returns session ID for SSE stream.

```typescript
// Request body:
{
  sessionId: string
  surveyData: SurveyData
  photoUrls: string[]        // Vercel Blob URLs from /api/upload
  count: number              // 1–8
}

// Response (immediate):
{
  streamId: string           // use to connect to SSE stream
}

// Background process:
// 1. Call PromptEngine to generate N concepts (Claude)
// 2. Parallel-generate images with concurrency limit 3
// 3. Each result pushed to SSE stream as it completes
// 4. Store generated images to Vercel Blob: session/{sessionId}/result-{n}.jpg
```

### GET /api/generate/stream

SSE endpoint for real-time progress.

```typescript
// Query: ?streamId=xxx

// Events:
data: {"type":"concept","index":0,"title":"Fremen Warrior of Arrakis"}
data: {"type":"progress","index":0,"status":"generating"}
data: {"type":"complete","index":0,"imageUrl":"https://...","title":"...","prompt":"..."}
data: {"type":"error","index":2,"message":"Content policy violation — retrying"}
data: {"type":"retry","index":2,"attempt":2}
data: {"type":"done","total":6,"successCount":6}
```

### POST /api/cleanup

Deletes all session blobs immediately.

```typescript
// Request body:
{ sessionId: string }

// Response:
{ deleted: number }

// Implementation: List + delete all blobs with prefix session/{sessionId}/
```

### POST /api/describe-photo (Internal)

Used by the Gemini provider to get an appearance description for face consistency.

```typescript
// Request: { photoUrl: string }
// Response: { description: string }  (via Gemini 2.0 Flash)
// Only called when AI_PROVIDER === 'gemini'
```

### Rate Limiting

Implement per-session rate limiting:
- Max 3 generation requests per session
- Max 24 images total per session
- If exceeded: return 429 with reset time

Use Vercel KV (or a simple in-memory cache with TTL for single-instance) to track counts.

---

## 10. Data Models & Types

### Core Types (`types/index.ts`)

```typescript
export interface SurveyData {
  movies:     string[]
  books:      string[]
  tvShows:    string[]
  superpower: string | undefined
  places:     string[]
  timePeriod: TimePeriod | undefined
  moods:      Mood[]
  artStyle:   ArtStyle
}

export interface UploadedPhoto {
  id:          string
  url:         string     // Vercel Blob URL
  previewUrl:  string     // base64 data URL for UI display
  size:        number
}

export interface ImageConcept {
  title:          string
  concept:        string
  imagePrompt:    string
  negativePrompt: string
  themeCombo:     ThemeCombination
}

export interface GeneratedImage {
  id:         string
  imageUrl:   string   // Vercel Blob URL
  title:      string
  prompt:     string
  provider:   ProviderName
  status:     'pending' | 'generating' | 'complete' | 'error'
  error?:     string
}

export interface SessionState {
  sessionId:       string
  surveyData:      SurveyData
  uploadedPhotos:  UploadedPhoto[]
  generatedImages: GeneratedImage[]
  imageCount:      number
  currentStep:     AppStep
  streamId?:       string
}

export type AppStep =
  | 'landing'
  | 'survey-entertainment'
  | 'survey-dreams'
  | 'survey-aesthetic'
  | 'photo-upload'
  | 'generation-settings'
  | 'generating'
  | 'results'

export type ProviderName = 'openai' | 'gemini' | 'stability'
export type TimePeriod = 'ancient' | 'medieval' | 'renaissance' | 'victorian' | 'modern' | 'future'
export type Mood = 'cinematic' | 'dreamy' | 'dark' | 'vibrant' | 'gritty' | 'surreal'
export type ArtStyle = 'photorealistic' | 'painted' | 'anime' | 'concept_art' | 'surprise'
```

---

## 11. Component Architecture

### Directory Structure

```
imaginary-me/
├── app/
│   ├── layout.tsx                    # Root layout, font, theme
│   ├── page.tsx                      # Landing page
│   ├── create/
│   │   └── page.tsx                  # Full creation flow
│   └── api/
│       ├── upload/route.ts
│       ├── generate/route.ts
│       ├── generate/stream/route.ts
│       ├── cleanup/route.ts
│       └── describe-photo/route.ts
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Outer chrome, progress header
│   │   └── StepProgress.tsx          # Dot progress indicator
│   │
│   ├── landing/
│   │   ├── HeroSection.tsx           # Headline + CTA
│   │   └── ExampleGallery.tsx        # Sample images carousel
│   │
│   ├── survey/
│   │   ├── SurveyWizard.tsx          # Orchestrates steps
│   │   ├── InterestTagInput.tsx      # Autocomplete + tag chips
│   │   ├── QuickPicks.tsx            # Pre-populated suggestion chips
│   │   ├── SingleSelect.tsx          # Card-style single select
│   │   ├── MultiSelect.tsx           # Card-style multi-select
│   │   └── steps/
│   │       ├── EntertainmentStep.tsx
│   │       ├── DreamsStep.tsx
│   │       └── AestheticStep.tsx
│   │
│   ├── upload/
│   │   ├── PhotoUpload.tsx           # Main upload container
│   │   ├── DropZone.tsx             # Drag-and-drop area
│   │   ├── PhotoThumbnail.tsx        # Single photo preview + remove
│   │   └── UploadTips.tsx           # Guidance copy
│   │
│   ├── generation/
│   │   ├── GenerationSettings.tsx    # Count slider + concept preview
│   │   ├── ConceptPreview.tsx        # Text list of planned themes
│   │   └── GenerateButton.tsx        # Big CTA button with states
│   │
│   ├── loading/
│   │   ├── GenerationLoading.tsx     # Loading screen container
│   │   ├── ImageSkeleton.tsx         # Animated shimmer card
│   │   └── StatusMessage.tsx         # "Placing you in Dune..." text
│   │
│   └── results/
│       ├── ResultsGallery.tsx        # Grid container
│       ├── ImageCard.tsx             # Single result card
│       ├── ImageActions.tsx          # Download / Regenerate / Info
│       ├── PromptViewer.tsx          # Modal showing prompt used
│       ├── DownloadAllButton.tsx     # Zip download
│       └── SessionActions.tsx        # Adjust / New Photos / Start Over
│
├── lib/
│   ├── ai/
│   │   ├── types.ts                  # Provider interface
│   │   ├── factory.ts               # Returns configured provider
│   │   ├── prompt-engine.ts         # Survey → concepts
│   │   └── providers/
│   │       ├── openai.ts
│   │       ├── gemini.ts
│   │       └── stability.ts
│   │
│   ├── storage/
│   │   └── blob.ts                  # Vercel Blob helpers
│   │
│   └── validation/
│       └── schemas.ts               # Zod schemas
│
├── hooks/
│   ├── useSurvey.ts                 # Survey state actions
│   ├── usePhotoUpload.ts            # Upload flow + preview generation
│   ├── useGeneration.ts             # Trigger generation + SSE listener
│   └── useDownload.ts              # Single + bulk download helpers
│
├── store/
│   └── session.ts                   # Zustand store definition
│
├── config/
│   └── ai-config.ts                # Provider selection + model config
│
└── public/
    ├── example-1.jpg               # Landing page examples
    ├── example-2.jpg
    └── example-3.jpg
```

### Key Component Behaviors

**`InterestTagInput`**
- Debounced autocomplete (300ms) from a seeded list
- Enter / comma / tab to add tag
- Backspace to remove last tag
- Tag count badge shows remaining capacity
- Gracefully handles paste of comma-separated lists

**`PhotoUpload`**
- Client-side resize before upload: `canvas.toBlob()` to max 1024px
- Shows EXIF-stripped preview immediately (privacy-respecting)
- Reorder photos via drag (first photo = primary reference)
- Graceful error states: file too large, wrong type, upload failed

**`ImageCard`**
- Hover/tap reveals overlay with actions
- "Download" triggers direct blob URL download (`<a download>`)
- "Regenerate" sends a single-image re-generation request with same concept
- "View Prompt" opens `<PromptViewer>` sheet/modal
- Long-press on mobile = same as hover on desktop

**`GenerationLoading`**
- Grid of `<ImageSkeleton>` cards matching the requested count
- As each image completes via SSE, skeleton transitions to the real image
- Status text cycles through fun messages: "Placing you in Arrakis...", "Weaving your magic..."

---

## 12. State Management

### Zustand Store

```typescript
// store/session.ts

interface SessionStore {
  // State
  sessionId:       string
  currentStep:     AppStep
  surveyData:      SurveyData
  uploadedPhotos:  UploadedPhoto[]
  imageCount:      number
  generatedImages: GeneratedImage[]
  streamId:        string | null

  // Actions
  setSurveyData:     (data: Partial<SurveyData>) => void
  setPhotos:         (photos: UploadedPhoto[]) => void
  addPhoto:          (photo: UploadedPhoto) => void
  removePhoto:       (id: string) => void
  setImageCount:     (count: number) => void
  goToStep:          (step: AppStep) => void
  startGeneration:   (streamId: string) => void
  updateImage:       (id: string, update: Partial<GeneratedImage>) => void
  setGeneratedImages:(images: GeneratedImage[]) => void
  resetSession:      () => void
}
```

### URL State (Step Navigation)

Steps are reflected in the URL as a query param (`?step=survey-entertainment`) to enable browser back button navigation. URL state is synced from Zustand but the store is the source of truth.

### Cleanup on Exit

```typescript
// app/create/page.tsx
useEffect(() => {
  const cleanup = () => {
    navigator.sendBeacon('/api/cleanup', JSON.stringify({ sessionId }))
  }
  window.addEventListener('beforeunload', cleanup)
  return () => window.removeEventListener('beforeunload', cleanup)
}, [sessionId])
```

---

## 13. Implementation Phases

### Sprint 1 — Project Scaffold & Survey (Week 1)

**Goals:** Working Next.js app, complete survey wizard, no AI yet.

Tasks:
- [ ] `npx create-next-app@latest imaginary-me --typescript --tailwind --app`
- [ ] Install and configure shadcn/ui
- [ ] Install Zustand, react-hook-form, zod, framer-motion, lucide-react
- [ ] Implement `SessionStore` (Zustand)
- [ ] Build `AppShell` + `StepProgress` layout components
- [ ] Build `Landing` page with placeholder hero section
- [ ] Build `InterestTagInput` with autocomplete
- [ ] Build `QuickPicks` suggestion chips
- [ ] Build `EntertainmentStep` (movies, books, shows)
- [ ] Build `DreamsStep` (superpower, places, time period)
- [ ] Build `AestheticStep` (mood cards, art style cards)
- [ ] Wire up `SurveyWizard` with step navigation
- [ ] Add Zod survey validation
- [ ] Mobile responsive survey layout
- [ ] Step URL sync (query param)

**Exit criteria:** User can complete full survey on mobile and desktop, data persists in store, back/next works correctly.

---

### Sprint 2 — Photo Upload (Week 1–2)

**Goals:** Photo upload pipeline, temp storage, previews.

Tasks:
- [ ] Install `react-dropzone`, `@vercel/blob`
- [ ] Build `DropZone` with drag-and-drop + tap-to-pick
- [ ] Implement client-side image resize (canvas API, max 1024px)
- [ ] Implement client-side EXIF strip (privacy)
- [ ] Build `PhotoThumbnail` with remove button
- [ ] Build `PhotoUpload` container with 1–3 photo limit
- [ ] Implement `POST /api/upload` route
  - Multipart parsing
  - Magic bytes validation
  - File size + count limits
  - Vercel Blob storage with session prefix
- [ ] Wire upload to store (`uploadedPhotos`)
- [ ] Build `UploadTips` guidance component
- [ ] Handle upload error states gracefully (toast notifications)

**Exit criteria:** User can upload 1–3 photos, photos show as thumbnails, temp URLs stored in state, errors handled gracefully.

---

### Sprint 3 — AI Pipeline (Week 2–3)

**Goals:** Full generation pipeline — Claude prompt engine + all 3 image providers.

Tasks:
- [ ] Install `openai`, `@google/generative-ai`, `@anthropic-ai/sdk`
- [ ] Create `config/ai-config.ts` with provider configuration
- [ ] Define `ImageProvider` interface + `GenerationRequest/Result` types
- [ ] Implement `lib/ai/providers/openai.ts`
  - Text-to-image (`images.generate`)
  - Image-to-image (`images.edit` with reference photo)
- [ ] Implement `lib/ai/providers/gemini.ts`
  - `POST /api/describe-photo` route for appearance extraction
  - Imagen 3 text-to-image call
- [ ] Implement `lib/ai/providers/stability.ts`
  - SD3 text-to-image
  - img2img with `image_strength`
- [ ] Implement `lib/ai/factory.ts` (provider selection by env var)
- [ ] Implement `lib/ai/prompt-engine.ts`
  - Theme selection algorithm
  - Claude API call for concept generation
  - Style suffix application
  - Provider-specific prompt formatting
- [ ] Implement `POST /api/generate` route
  - Validate request
  - Run PromptEngine
  - Parallel image generation (concurrency 3)
  - Store results to Vercel Blob
- [ ] Implement `GET /api/generate/stream` SSE endpoint
- [ ] Implement `useGeneration` hook (trigger + SSE listener)
- [ ] Error handling: content policy rejection + retry with modified prompt
- [ ] Rate limiting (3 requests / 24 images per session)

**Exit criteria:** End-to-end generation works with at least one provider, SSE streams progress to client.

---

### Sprint 4 — Results & Downloads (Week 3)

**Goals:** Results gallery, downloads, regeneration, session actions.

Tasks:
- [ ] Build `GenerationLoading` with skeleton grid + SSE-driven reveals
- [ ] Build `ResultsGallery` responsive grid (2/3/4 columns)
- [ ] Build `ImageCard` with hover/tap overlay
- [ ] Build `ImageActions` (Download, Regenerate, View Prompt)
- [ ] Build `PromptViewer` sheet component
- [ ] Implement single-image download (direct blob URL)
- [ ] Implement `DownloadAllButton` (JSZip, zip all images)
- [ ] Build `SessionActions` (Adjust Interests / New Photos / Start Over)
- [ ] Implement `POST /api/cleanup` route
- [ ] Wire `beforeunload` cleanup
- [ ] Implement single-image regeneration (re-run with same concept)
- [ ] Add success/error toasts throughout

**Exit criteria:** User can view, download (individually or all), and regenerate images. Session cleans up on exit.

---

### Sprint 5 — Polish, Testing & Launch Prep (Week 4)

**Goals:** Production-ready quality, performance, mobile QA.

Tasks:
- [ ] Landing page: final copy, example images, animated hero
- [ ] `ExampleGallery` with pre-generated sample images
- [ ] Framer Motion page transitions
- [ ] Loading screen fun copy rotation ("Forging your stillsuit...")
- [ ] Error boundary + graceful fallback UI
- [ ] Add `<meta>` tags (OG image, description)
- [ ] Configure `next.config.js`: image domains, security headers
- [ ] Vercel deployment + environment variable configuration
- [ ] Mobile QA: test on iPhone SE (375px), iPad (768px)
- [ ] Test all 3 AI providers in staging
- [ ] Write unit tests for PromptEngine theme selection
- [ ] Write unit tests for Zod schemas
- [ ] Write E2E test for happy path (survey → upload → generate → download)
- [ ] Performance audit: Lighthouse score > 85
- [ ] Accessibility audit: keyboard navigation, ARIA labels

**Exit criteria:** Deployed to Vercel, passes E2E test, Lighthouse > 85, tested on real mobile.

---

## 14. Configuration & Environment Variables

### Required Environment Variables

```bash
# .env.local

# Active AI provider (openai | gemini | stability)
AI_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=sk-...

# Google Gemini
GEMINI_API_KEY=AI...

# Stability AI
STABILITY_API_KEY=sk-...

# Anthropic (for prompt engineering — always required)
ANTHROPIC_API_KEY=sk-ant-...

# Vercel Blob (auto-provided in Vercel deployments)
BLOB_READ_WRITE_TOKEN=...

# Session rate limiting (optional: use Vercel KV)
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### `config/ai-config.ts`

```typescript
export const AI_CONFIG = {
  provider: (process.env.AI_PROVIDER || 'openai') as ProviderName,

  openai: {
    apiKey:          process.env.OPENAI_API_KEY!,
    textToImageModel: 'gpt-image-1',
    imageSize:       '1024x1024' as const,
    imageQuality:    'standard' as const,  // or 'hd' for premium
  },

  gemini: {
    apiKey:     process.env.GEMINI_API_KEY!,
    imageModel: 'imagen-3.0-generate-002',
    visionModel:'gemini-2.0-flash',   // for photo description
  },

  stability: {
    apiKey:        process.env.STABILITY_API_KEY!,
    engine:        'stable-diffusion-xl-1024-v1-0',
    imageStrength: 0.65,   // img2img strength (0 = original, 1 = fully new)
    steps:         30,
    cfgScale:      7,
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model:  'claude-opus-4-7',
    maxTokens: 1024,
  },

  generation: {
    defaultCount:    4,
    maxCount:        8,
    concurrencyLimit: 3,
    sessionMaxRequests: 3,
    sessionMaxImages:  24,
  },

  storage: {
    photoTtlSeconds:     3600,      // 1 hour
    generatedTtlSeconds: 86400,     // 24 hours
  },
} as const
```

---

## 15. Security Considerations

### Input Validation
- All API inputs validated with Zod before processing
- File uploads: magic bytes check (not just MIME headers), max size enforced server-side
- Survey text fields: max length enforced, HTML stripped
- Session IDs: UUID format validation, no path traversal possible (used as Blob key prefix only)

### API Key Protection
- All AI API keys server-side only (Next.js API routes)
- Never exposed to client bundle
- Vercel environment variables encrypted at rest

### Content Safety
- PromptEngine includes a content filter pass before calling image APIs
- Image API responses checked for provider-reported policy violations
- Graceful fallback on content rejection (retry with modified prompt, not error to user)

### Blob Storage Security
- All blobs stored with session-prefixed keys
- Blob URLs are unguessable (UUID components)
- TTL enforced — no permanent storage
- `POST /api/cleanup` validates sessionId matches requesting session

### Rate Limiting
- Per-session rate limiting on `/api/generate`
- Next.js middleware rate limiting on all API routes (100 req/min per IP)

### No PII Storage
- No user accounts, no email, no cookies beyond sessionStorage
- EXIF data stripped from photos client-side before upload
- Session data never written to any database

---

## 16. Performance Strategy

### Image Loading
- Generated images served from Vercel Blob CDN (global edge)
- `next/image` with `blurDataURL` placeholder during load
- Lazy load gallery images below the fold

### Generation Latency
- Parallel generation (concurrency 3) cuts wall time by ~60%
- SSE streaming reveals images as they complete — perceived performance
- Claude prompt generation cached (if same survey data, same concepts)

### Bundle Size
- Dynamic imports for heavy libraries (JSZip loaded only when downloading all)
- Provider SDK code only imported server-side (API routes)
- `framer-motion` tree-shaken

### API Response Times
- Upload: < 500ms (client resize + blob PUT)
- Generation start: < 200ms (just kicks off background process)
- SSE stream: first image within 10–20s depending on provider

---

## 17. Testing Strategy

### Unit Tests (Vitest)

```
tests/unit/
├── prompt-engine.test.ts     # Theme selection, combination logic
├── schemas.test.ts           # Zod validation edge cases
├── provider-factory.test.ts  # Correct provider returned per config
└── session-store.test.ts     # Zustand store actions
```

### Component Tests (Testing Library)

```
tests/components/
├── InterestTagInput.test.tsx  # Add/remove tags, autocomplete
├── PhotoUpload.test.tsx       # File validation, preview
├── ImageCard.test.tsx         # Download trigger, actions
└── SurveyWizard.test.tsx      # Step navigation, validation
```

### E2E Tests (Playwright)

```
tests/e2e/
├── happy-path.spec.ts        # Full flow: survey → upload → generate → download
├── mobile.spec.ts            # Same flow at 375px viewport
├── edit-flow.spec.ts         # "Adjust Interests" and "New Photos" paths
└── cleanup.spec.ts           # Verify blobs deleted on exit
```

### Manual QA Checklist (Pre-Launch)

- [ ] Survey: all fields accept input, tags add/remove correctly
- [ ] Survey: "Back" preserves all data
- [ ] Upload: drag-and-drop works on desktop
- [ ] Upload: tap-to-pick works on iOS and Android
- [ ] Upload: wrong file type shows error
- [ ] Upload: file too large shows error
- [ ] Generation: all 3 providers generate successfully
- [ ] Generation: SSE reveals images progressively
- [ ] Results: single download works
- [ ] Results: download all creates valid ZIP
- [ ] Results: "Adjust Interests" returns to survey with data intact
- [ ] Results: "Start Over" clears everything
- [ ] Closing tab sends cleanup beacon (verify in Vercel Blob console)

---

## 18. Phase 2 Roadmap — Audio

Audio features were explicitly scoped out of Phase 1. This section documents the full design for when they are ready to implement.

### Concept

For each generated image, optionally generate an audio experience:
- **Ambient soundtrack** matching the image theme (e.g., desert winds for Dune, ethereal strings for Harry Potter)
- **Thematic narration** (voiceover introducing "who" the user is in this world)

### Audio Provider Options

| Provider | Use Case | API |
|---|---|---|
| ElevenLabs | Voiceover / narration | Text-to-speech with voice cloning (premium) or preset voices |
| Suno AI | Ambient music generation | Prompt-to-music (if public API available) |
| OpenAI TTS | Simple narration | `tts-1` or `tts-1-hd` models, many voices |
| Stability Audio | Ambient soundscape | AudioGen / AudioCraft equivalent |

### Recommended Phase 2 Stack

- **Narration:** OpenAI TTS (`tts-1-hd`, `onyx` voice for epic tone, `nova` for approachable)
- **Music:** ElevenLabs Sound Effects API or Suno (when public API stabilizes)

### UX Addition

- Results gallery: each `ImageCard` shows a play button
- On play: card shows audio waveform animation, narration/ambient track plays
- Audio generated on-demand (not alongside images, to not block Phase 1 generation)
- "Play All" button: slideshow mode — transitions between images with audio

### Claude Narration Script Generation

```
System prompt: "You are a dramatic narrator for an AI portrait gallery.
Given this scene concept, write a 15-20 second narration script in a
tone that matches the aesthetic mood. The narration introduces the person
as if they truly belong in this world."
```

### Phase 2 Implementation Tasks

- [ ] Add `narrativeScript` field to `ImageConcept`
- [ ] Claude generates narration text alongside image concept
- [ ] `POST /api/generate-audio` route (called lazily on first play)
- [ ] OpenAI TTS call, store audio to Vercel Blob (24hr TTL)
- [ ] `AudioPlayer` component with waveform visualization
- [ ] `PlayButton` on `ImageCard` (visible when audio ready)
- [ ] Slideshow / "Play All" mode in `ResultsGallery`
- [ ] Mobile: audio respects silent mode (user expectation)

---

## 19. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Face inconsistency** — generated images don't look like the user | High | High | Document limitation clearly; use best-fit provider per use case; offer "regenerate" to try again |
| **Content policy rejection** — provider refuses a prompt | Medium | Medium | Automatic retry with softened prompt; fallback to generic fantasy theme if 2nd retry fails |
| **Provider API outage** | Low | High | Configurable fallback provider order; user-visible "AI service temporarily unavailable" message |
| **High API costs** — 8 images × DALL-E 3 HD = ~$1/session | Medium | Medium | Default to `standard` quality; cap sessions at 24 images; monitor spend via usage dashboard |
| **Slow generation** — users abandon if > 45s total | Medium | High | Parallel generation (concurrency 3); SSE progressive reveal; fun loading copy |
| **Blob cleanup failure** — orphaned files accumulate costs | Low | Low | TTLs handle it; Vercel Blob cost per GB is low; add admin cleanup cron as extra safety |
| **Mobile upload issues** — iOS restrictions on file access | Medium | Medium | Use `<input type="file" accept="image/*" capture>` fallback; test on real iOS devices |
| **NSFW profile photos** — users upload inappropriate images | Low | High | Server-side: use OpenAI moderation endpoint to check photos before storing; reject + inform user |

### Photo Moderation (Safety)

Before storing any uploaded photo to Vercel Blob:

```typescript
// In POST /api/upload:
const moderation = await openai.moderations.create({
  input: [{ type: 'image_url', image_url: { url: photoDataUrl } }]
})
if (moderation.results[0].flagged) {
  return NextResponse.json({ error: 'Photo could not be accepted' }, { status: 400 })
}
```

---

## Appendix A: Popular Franchise Theme Templates

A seeded knowledge base for the PromptEngine's theme selection (JSON, 50+ entries).

Sample structure:
```json
{
  "Dune": {
    "characters": ["Fremen warrior", "Bene Gesserit sister", "Guild Navigator", "House noble"],
    "settings": ["desert of Arrakis", "underground Sietch", "Geidi Prime", "Caladan"],
    "visualStyle": "epic sci-fi, sandy tones, blue eyes, stillsuit fabric"
  },
  "Harry Potter": {
    "characters": ["Hogwarts student", "battle-hardened wizard", "Auror", "Hogwarts professor"],
    "settings": ["Hogwarts Great Hall", "Diagon Alley", "Forbidden Forest", "Ministry of Magic"],
    "visualStyle": "magical realism, warm candlelight, robes, wand in hand"
  },
  "Japan": {
    "characters": ["samurai warrior", "ninja", "geisha", "modern city dweller"],
    "settings": ["feudal Japan forest", "cherry blossom garden", "neon Tokyo street", "Mount Fuji summit"],
    "visualStyle": "cinematic, ukiyo-e influence or photorealistic, cultural dress"
  }
}
```

---

## Appendix B: Landing Page Copy

**Headline:** "Reimagine yourself in infinite worlds"  
**Subhead:** "Tell us what you love. Upload a photo. Discover who you could be."  
**CTA:** "Start Creating →"  
**Trust line:** "No account needed. Your photos are never saved."

**Example captions (for landing gallery):**
- "Based on Dune + Japan"
- "Based on Harry Potter + Iceland + Dark aesthetic"  
- "Based on Avatar + Teleportation superpower"

---

*End of PLAN1.md — Version 1.0*
