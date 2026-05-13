/**
 * @fileoverview Core TypeScript types for imaginary-me.
 * Shared between client and server; no runtime imports.
 */

// ── Enums / union types ──────────────────────────────────────────────────────

export type ProviderName = 'openai' | 'gemini' | 'stability'

export type TimePeriod =
  | 'ancient'
  | 'medieval'
  | 'renaissance'
  | 'victorian'
  | 'modern'
  | 'future'

export type Mood =
  | 'cinematic'
  | 'dreamy'
  | 'dark'
  | 'vibrant'
  | 'gritty'
  | 'surreal'

export type ArtStyle =
  | 'photorealistic'
  | 'painted'
  | 'anime'
  | 'concept_art'
  | 'surprise'

export type AppStep =
  | 'landing'
  | 'survey-entertainment'
  | 'survey-dreams'
  | 'survey-aesthetic'
  | 'photo-upload'
  | 'generation-settings'
  | 'generating'
  | 'results'

// ── Survey data ──────────────────────────────────────────────────────────────

export interface SurveyData {
  readonly movies: readonly string[]
  readonly books: readonly string[]
  readonly tvShows: readonly string[]
  readonly superpower: string | undefined
  readonly places: readonly string[]
  readonly timePeriod: TimePeriod | undefined
  readonly moods: readonly Mood[]
  readonly artStyle: ArtStyle
}

export const DEFAULT_SURVEY_DATA: SurveyData = {
  movies: [],
  books: [],
  tvShows: [],
  superpower: undefined,
  places: [],
  timePeriod: undefined,
  moods: [],
  artStyle: 'surprise',
}

// ── Photos ───────────────────────────────────────────────────────────────────

export interface UploadedPhoto {
  readonly id: string
  /** Vercel Blob URL (server-side temp storage) */
  readonly url: string
  /** base64 data URL for local UI preview */
  readonly previewUrl: string
  readonly size: number
}

// ── AI generation ────────────────────────────────────────────────────────────

export interface ThemeCombination {
  readonly primary: string
  readonly secondary?: string
  readonly modifier?: string
}

export interface ImageConcept {
  readonly title: string
  readonly concept: string
  readonly imagePrompt: string
  readonly negativePrompt: string
  readonly themeCombo: ThemeCombination
}

export type GeneratedImageStatus = 'pending' | 'generating' | 'complete' | 'error'

export interface GeneratedImage {
  readonly id: string
  /** Vercel Blob URL */
  readonly imageUrl: string
  readonly title: string
  readonly prompt: string
  readonly provider: ProviderName
  readonly status: GeneratedImageStatus
  readonly error?: string
}

// ── Session ──────────────────────────────────────────────────────────────────

export interface SessionState {
  readonly sessionId: string
  readonly surveyData: SurveyData
  readonly uploadedPhotos: readonly UploadedPhoto[]
  readonly generatedImages: readonly GeneratedImage[]
  readonly imageCount: number
  readonly currentStep: AppStep
  readonly streamId?: string
}

// ── API payloads ─────────────────────────────────────────────────────────────

export interface UploadResponse {
  readonly uploads: ReadonlyArray<{
    readonly id: string
    readonly url: string
    readonly size: number
  }>
}

export interface GenerateRequest {
  readonly sessionId: string
  readonly surveyData: SurveyData
  readonly photoUrls: readonly string[]
  readonly count: number
}

export interface GenerateResponse {
  readonly streamId: string
}

export interface CleanupRequest {
  readonly sessionId: string
}

export interface CleanupResponse {
  readonly deleted: number
}

// ── SSE stream events ────────────────────────────────────────────────────────

export type StreamEvent =
  | { readonly type: 'concept'; readonly index: number; readonly title: string }
  | { readonly type: 'progress'; readonly index: number; readonly status: string }
  | {
      readonly type: 'complete'
      readonly index: number
      readonly imageUrl: string
      readonly title: string
      readonly prompt: string
    }
  | { readonly type: 'error'; readonly index: number; readonly message: string }
  | { readonly type: 'retry'; readonly index: number; readonly attempt: number }
  | { readonly type: 'done'; readonly total: number; readonly successCount: number }

// ── Survey step form values ──────────────────────────────────────────────────

export interface EntertainmentFormValues {
  readonly movies: string[]
  readonly books: string[]
  readonly tvShows: string[]
}

export interface DreamsFormValues {
  readonly superpower: string
  readonly places: string[]
  readonly timePeriod: TimePeriod | ''
}

export interface AestheticFormValues {
  readonly moods: Mood[]
  readonly artStyle: ArtStyle
}
