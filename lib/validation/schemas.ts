/**
 * @fileoverview Zod schemas for survey data and API inputs.
 * Used on both client (form validation) and server (API validation).
 */

import { z } from 'zod'

// ── Enum schemas ─────────────────────────────────────────────────────────────

export const TimePeriodSchema = z.enum([
  'ancient',
  'medieval',
  'renaissance',
  'victorian',
  'modern',
  'future',
])

export const MoodSchema = z.enum([
  'cinematic',
  'dreamy',
  'dark',
  'vibrant',
  'gritty',
  'surreal',
])

export const ArtStyleSchema = z.enum([
  'photorealistic',
  'painted',
  'anime',
  'concept_art',
  'surprise',
])

// ── Per-step schemas (for react-hook-form) ───────────────────────────────────

export const EntertainmentSchema = z.object({
  movies: z.array(z.string().max(100)).max(5).default([]),
  books: z.array(z.string().max(100)).max(5).default([]),
  tvShows: z.array(z.string().max(100)).max(5).default([]),
})

export const DreamsSchema = z.object({
  superpower: z.string().max(100).default(''),
  places: z.array(z.string().max(100)).max(5).default([]),
  timePeriod: z.union([TimePeriodSchema, z.literal('')]).default(''),
})

export const AestheticSchema = z.object({
  moods: z.array(MoodSchema).max(2).default([]),
  artStyle: ArtStyleSchema.default('surprise'),
})

// ── Full survey schema ───────────────────────────────────────────────────────

export const SurveySchema = z.object({
  movies: z.array(z.string().max(100)).max(5).default([]),
  books: z.array(z.string().max(100)).max(5).default([]),
  tvShows: z.array(z.string().max(100)).max(5).default([]),
  superpower: z.string().max(100).optional(),
  places: z.array(z.string().max(100)).max(5).default([]),
  timePeriod: TimePeriodSchema.optional(),
  moods: z.array(MoodSchema).max(2).default([]),
  artStyle: ArtStyleSchema.default('surprise'),
})

export type SurveySchemaType = z.infer<typeof SurveySchema>

// ── API request schemas ──────────────────────────────────────────────────────

export const GenerateRequestSchema = z.object({
  sessionId: z.string().uuid(),
  surveyData: SurveySchema,
  photoUrls: z.array(z.string().url()).max(3),
  count: z.number().int().min(1).max(8),
})

export const CleanupRequestSchema = z.object({
  sessionId: z.string().uuid(),
})

export const UploadedPhotoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  previewUrl: z.string(),
  size: z.number().positive(),
})

// ── Validation helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the survey has at least one source of inspiration.
 * @param data - Partial survey data to check.
 * @returns Whether generation is unlocked.
 */
export function hasSurveyMinimum(
  data: Partial<SurveySchemaType>,
): boolean {
  return (
    (data.movies?.length ?? 0) > 0 ||
    (data.books?.length ?? 0) > 0 ||
    (data.tvShows?.length ?? 0) > 0 ||
    Boolean(data.superpower?.trim()) ||
    (data.places?.length ?? 0) > 0
  )
}
