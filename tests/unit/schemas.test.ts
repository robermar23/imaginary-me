import { describe, it, expect } from 'vitest'
import {
  SurveySchema,
  EntertainmentSchema,
  DreamsSchema,
  AestheticSchema,
  GenerateRequestSchema,
  CleanupRequestSchema,
  hasSurveyMinimum,
} from '@/lib/validation/schemas'

// ── SurveySchema ──────────────────────────────────────────────────────────────

describe('SurveySchema', () => {
  it('accepts a fully populated survey', () => {
    const result = SurveySchema.safeParse({
      movies: ['Dune', 'Inception'],
      books: ['Foundation'],
      tvShows: ['Arcane'],
      superpower: 'Teleportation',
      places: ['Japan', 'Iceland'],
      timePeriod: 'future',
      moods: ['cinematic', 'dark'],
      artStyle: 'photorealistic',
    })
    expect(result.success).toBe(true)
  })

  it('applies defaults for omitted optional fields', () => {
    const result = SurveySchema.safeParse({})
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.movies).toEqual([])
    expect(result.data.moods).toEqual([])
    expect(result.data.artStyle).toBe('surprise')
  })

  it('rejects movies array exceeding 5 items', () => {
    const result = SurveySchema.safeParse({
      movies: ['a', 'b', 'c', 'd', 'e', 'f'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects a movie title longer than 100 chars', () => {
    const result = SurveySchema.safeParse({
      movies: ['x'.repeat(101)],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid mood value', () => {
    const result = SurveySchema.safeParse({ moods: ['epic'] })
    expect(result.success).toBe(false)
  })

  it('rejects moods array exceeding 2 items', () => {
    const result = SurveySchema.safeParse({
      moods: ['cinematic', 'dark', 'dreamy'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid artStyle value', () => {
    const result = SurveySchema.safeParse({ artStyle: 'watercolor' })
    expect(result.success).toBe(false)
  })

  it('accepts an empty survey (all defaults)', () => {
    expect(SurveySchema.safeParse({}).success).toBe(true)
  })
})

// ── EntertainmentSchema ───────────────────────────────────────────────────────

describe('EntertainmentSchema', () => {
  it('accepts up to 5 books', () => {
    const result = EntertainmentSchema.safeParse({
      books: ['A', 'B', 'C', 'D', 'E'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects more than 5 tvShows', () => {
    const result = EntertainmentSchema.safeParse({
      tvShows: ['a', 'b', 'c', 'd', 'e', 'f'],
    })
    expect(result.success).toBe(false)
  })
})

// ── DreamsSchema ──────────────────────────────────────────────────────────────

describe('DreamsSchema', () => {
  it('accepts a valid time period', () => {
    const result = DreamsSchema.safeParse({ timePeriod: 'medieval' })
    expect(result.success).toBe(true)
  })

  it('accepts empty string timePeriod (no selection)', () => {
    const result = DreamsSchema.safeParse({ timePeriod: '' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid time period', () => {
    const result = DreamsSchema.safeParse({ timePeriod: 'space-age' })
    expect(result.success).toBe(false)
  })

  it('rejects superpower longer than 100 chars', () => {
    const result = DreamsSchema.safeParse({ superpower: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })
})

// ── AestheticSchema ───────────────────────────────────────────────────────────

describe('AestheticSchema', () => {
  it('accepts valid mood pair', () => {
    const result = AestheticSchema.safeParse({
      moods: ['vibrant', 'surreal'],
      artStyle: 'anime',
    })
    expect(result.success).toBe(true)
  })

  it('rejects more than 2 moods', () => {
    const result = AestheticSchema.safeParse({
      moods: ['cinematic', 'dark', 'gritty'],
    })
    expect(result.success).toBe(false)
  })
})

// ── GenerateRequestSchema ─────────────────────────────────────────────────────

describe('GenerateRequestSchema', () => {
  const BASE = {
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    surveyData: { movies: ['Dune'], books: [], tvShows: [], places: [], moods: [], artStyle: 'surprise' },
    photoUrls: ['https://example.com/photo.jpg'],
    count: 4,
  }

  it('accepts a valid request', () => {
    expect(GenerateRequestSchema.safeParse(BASE).success).toBe(true)
  })

  it('rejects a non-UUID sessionId', () => {
    expect(GenerateRequestSchema.safeParse({ ...BASE, sessionId: 'not-a-uuid' }).success).toBe(false)
  })

  it('rejects count below 1', () => {
    expect(GenerateRequestSchema.safeParse({ ...BASE, count: 0 }).success).toBe(false)
  })

  it('rejects count above 8', () => {
    expect(GenerateRequestSchema.safeParse({ ...BASE, count: 9 }).success).toBe(false)
  })

  it('rejects more than 3 photoUrls', () => {
    const result = GenerateRequestSchema.safeParse({
      ...BASE,
      photoUrls: [
        'https://a.com/1.jpg',
        'https://a.com/2.jpg',
        'https://a.com/3.jpg',
        'https://a.com/4.jpg',
      ],
    })
    expect(result.success).toBe(false)
  })
})

// ── CleanupRequestSchema ──────────────────────────────────────────────────────

describe('CleanupRequestSchema', () => {
  it('accepts a valid UUID', () => {
    expect(
      CleanupRequestSchema.safeParse({ sessionId: '550e8400-e29b-41d4-a716-446655440000' }).success,
    ).toBe(true)
  })

  it('rejects a non-UUID sessionId', () => {
    expect(CleanupRequestSchema.safeParse({ sessionId: 'abc' }).success).toBe(false)
  })
})

// ── hasSurveyMinimum ──────────────────────────────────────────────────────────

describe('hasSurveyMinimum', () => {
  it('returns true when movies are present', () => {
    expect(hasSurveyMinimum({ movies: ['Dune'] })).toBe(true)
  })

  it('returns true when only superpower is set', () => {
    expect(hasSurveyMinimum({ superpower: 'Teleportation' })).toBe(true)
  })

  it('returns true when only places are present', () => {
    expect(hasSurveyMinimum({ places: ['Japan'] })).toBe(true)
  })

  it('returns false for completely empty survey', () => {
    expect(hasSurveyMinimum({})).toBe(false)
  })

  it('returns false when superpower is whitespace only', () => {
    expect(hasSurveyMinimum({ superpower: '   ' })).toBe(false)
  })

  it('returns false when all arrays are empty and no superpower', () => {
    expect(hasSurveyMinimum({ movies: [], books: [], tvShows: [], places: [] })).toBe(false)
  })
})
