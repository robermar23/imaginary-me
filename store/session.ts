/**
 * @fileoverview Zustand session store — single source of truth for all ephemeral state.
 * sessionId is generated client-side (crypto.randomUUID) and persisted in sessionStorage.
 */

import { create } from 'zustand'
import type {
  AppStep,
  ArtStyle,
  GeneratedImage,
  Mood,
  SurveyData,
  TimePeriod,
  UploadedPhoto,
} from '@/types'
import { DEFAULT_SURVEY_DATA } from '@/types'

// ── Remix helpers ─────────────────────────────────────────────────────────────
// Must stay in sync with the union types in types/index.ts

const ALL_TIME_PERIODS: readonly TimePeriod[] = [
  'ancient',
  'medieval',
  'renaissance',
  'victorian',
  'modern',
  'future',
]

const ALL_MOODS: readonly Mood[] = [
  'cinematic',
  'dreamy',
  'dark',
  'vibrant',
  'gritty',
  'surreal',
]

const ALL_ART_STYLES: readonly ArtStyle[] = [
  'photorealistic',
  'painted',
  'anime',
  'concept_art',
  'surprise',
]

/**
 * Returns a random ArtStyle that differs from the current value.
 * @param current - The current ArtStyle to exclude from candidates.
 * @returns A different ArtStyle.
 */
function randomArtStyle(current: ArtStyle): ArtStyle {
  const others = ALL_ART_STYLES.filter((s) => s !== current)
  return others[Math.floor(Math.random() * others.length)]
}

// ── Store interface ───────────────────────────────────────────────────────────

interface SessionStore {
  // ── State ────────────────────────────────────────────────────────────────
  sessionId: string
  currentStep: AppStep
  surveyData: SurveyData
  uploadedPhotos: UploadedPhoto[]
  imageCount: number
  generatedImages: GeneratedImage[]
  streamId: string | null
  remixCount: number

  // ── Session init ─────────────────────────────────────────────────────────
  /** Must be called in a useEffect on the client to populate sessionId. */
  initializeSession: () => void

  // ── Navigation ───────────────────────────────────────────────────────────
  goToStep: (step: AppStep) => void

  // ── Survey ───────────────────────────────────────────────────────────────
  setMovies: (movies: string[]) => void
  setBooks: (books: string[]) => void
  setTvShows: (tvShows: string[]) => void
  setSuperpower: (superpower: string | undefined) => void
  setPlaces: (places: string[]) => void
  setTimePeriod: (timePeriod: TimePeriod | undefined) => void
  setMoods: (moods: Mood[]) => void
  setArtStyle: (artStyle: ArtStyle) => void

  // ── Photos ───────────────────────────────────────────────────────────────
  addPhoto: (photo: UploadedPhoto) => void
  removePhoto: (id: string) => void
  setPhotos: (photos: UploadedPhoto[]) => void

  // ── Generation ───────────────────────────────────────────────────────────
  setImageCount: (count: number) => void
  startGeneration: (streamId: string) => void
  updateImage: (id: string, update: Partial<GeneratedImage>) => void
  setGeneratedImages: (images: GeneratedImage[]) => void

  // ── Remix ────────────────────────────────────────────────────────────────
  remixSurveyData: () => void

  // ── Reset ────────────────────────────────────────────────────────────────
  resetSession: () => void
}

const SESSION_STORAGE_KEY = 'imaginary-me-session-id'

export const useSessionStore = create<SessionStore>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  sessionId: '',
  currentStep: 'landing',
  surveyData: { ...DEFAULT_SURVEY_DATA },
  uploadedPhotos: [],
  imageCount: 4,
  generatedImages: [],
  streamId: null,
  remixCount: 0,

  // ── Session init ──────────────────────────────────────────────────────────
  initializeSession: () => {
    if (typeof window === 'undefined') return
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY)
    const id = existing ?? crypto.randomUUID()
    if (!existing) sessionStorage.setItem(SESSION_STORAGE_KEY, id)
    set({ sessionId: id })
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  goToStep: (step) => set({ currentStep: step }),

  // ── Survey setters ────────────────────────────────────────────────────────
  setMovies: (movies) =>
    set((s) => ({ surveyData: { ...s.surveyData, movies } })),
  setBooks: (books) =>
    set((s) => ({ surveyData: { ...s.surveyData, books } })),
  setTvShows: (tvShows) =>
    set((s) => ({ surveyData: { ...s.surveyData, tvShows } })),
  setSuperpower: (superpower) =>
    set((s) => ({ surveyData: { ...s.surveyData, superpower } })),
  setPlaces: (places) =>
    set((s) => ({ surveyData: { ...s.surveyData, places } })),
  setTimePeriod: (timePeriod) =>
    set((s) => ({ surveyData: { ...s.surveyData, timePeriod } })),
  setMoods: (moods) =>
    set((s) => ({ surveyData: { ...s.surveyData, moods: [...moods] } })),
  setArtStyle: (artStyle) =>
    set((s) => ({ surveyData: { ...s.surveyData, artStyle } })),

  // ── Photos ────────────────────────────────────────────────────────────────
  addPhoto: (photo) =>
    set((s) => ({ uploadedPhotos: [...s.uploadedPhotos, photo] })),
  removePhoto: (id) =>
    set((s) => ({
      uploadedPhotos: s.uploadedPhotos.filter((p) => p.id !== id),
    })),
  setPhotos: (photos) => set({ uploadedPhotos: photos }),

  // ── Generation ────────────────────────────────────────────────────────────
  setImageCount: (imageCount) => set({ imageCount }),
  startGeneration: (streamId) =>
    set({ streamId, currentStep: 'generating' }),
  updateImage: (id, update) =>
    set((s) => ({
      generatedImages: s.generatedImages.map((img) =>
        img.id === id ? { ...img, ...update } : img,
      ),
    })),
  setGeneratedImages: (generatedImages) => set({ generatedImages }),

  // ── Remix ─────────────────────────────────────────────────────────────────
  remixSurveyData: () => {
    const { surveyData } = get()

    // Build an interest pool from all categories
    const pool: string[] = [
      ...surveyData.movies,
      ...surveyData.books,
      ...surveyData.tvShows,
      ...surveyData.places,
      ...(surveyData.superpower ? [surveyData.superpower] : []),
    ]

    // Guard: nothing to remix
    if (pool.length === 0) return

    // Shuffle the pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, Math.min(5, Math.max(2, shuffled.length)))

    // Distribute: first 2 → movies, next 2 → tvShows, rest → books
    const remixed: SurveyData = {
      movies: [...picked.slice(0, 2)],
      tvShows: [...picked.slice(2, 4)],
      books: [...picked.slice(4)],
      places: [...surveyData.places],
      superpower: surveyData.superpower,
      timePeriod: ALL_TIME_PERIODS[Math.floor(Math.random() * ALL_TIME_PERIODS.length)],
      moods: [ALL_MOODS[Math.floor(Math.random() * ALL_MOODS.length)]],
      artStyle: randomArtStyle(surveyData.artStyle),
    }

    set((s) => ({
      surveyData: remixed,
      generatedImages: [],
      remixCount: s.remixCount + 1,
    }))
  },

  // ── Reset ─────────────────────────────────────────────────────────────────
  resetSession: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
    const newId =
      typeof window !== 'undefined' ? crypto.randomUUID() : ''
    if (typeof window !== 'undefined' && newId) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, newId)
    }
    set({
      sessionId: newId,
      currentStep: 'landing',
      surveyData: { ...DEFAULT_SURVEY_DATA },
      uploadedPhotos: [],
      imageCount: 4,
      generatedImages: [],
      streamId: null,
      remixCount: 0,
    })
  },
}))

// ── Selectors ─────────────────────────────────────────────────────────────────

/** @returns Current survey data from the store. */
export const selectSurveyData = (s: SessionStore): SurveyData => s.surveyData

/** @returns True when the user has provided at least one interest. */
export const selectHasMinimumSurvey = (s: SessionStore): boolean => {
  const { movies, books, tvShows, superpower, places } = s.surveyData
  return (
    movies.length > 0 ||
    books.length > 0 ||
    tvShows.length > 0 ||
    Boolean(superpower?.trim()) ||
    places.length > 0
  )
}
