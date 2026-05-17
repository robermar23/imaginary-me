import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PromptEngine } from '@/lib/ai/prompt-engine'
import type { SurveyData } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const SURVEY_FULL: SurveyData = {
  movies: ['Dune', 'Inception'],
  books: ['Foundation'],
  tvShows: ['Arcane'],
  superpower: 'Teleportation',
  places: ['Japan', 'Iceland'],
  timePeriod: 'future',
  moods: ['cinematic', 'dark'],
  artStyle: 'photorealistic',
}

const SURVEY_EMPTY: SurveyData = {
  movies: [],
  books: [],
  tvShows: [],
  superpower: undefined,
  places: [],
  timePeriod: undefined,
  moods: [],
  artStyle: 'surprise',
}

// ── Mock path (no API key) ────────────────────────────────────────────────────

describe('PromptEngine — mock path (no API key)', () => {
  it('returns the requested number of concepts', async () => {
    const engine = new PromptEngine('')
    const concepts = await engine.generateConcepts(SURVEY_FULL, 4, 'openai')
    expect(concepts).toHaveLength(4)
  })

  it('returns concepts for count=1', async () => {
    const engine = new PromptEngine('')
    const concepts = await engine.generateConcepts(SURVEY_EMPTY, 1, 'openai')
    expect(concepts).toHaveLength(1)
  })

  it('returns concepts for count=8', async () => {
    const engine = new PromptEngine('')
    const concepts = await engine.generateConcepts(SURVEY_EMPTY, 8, 'stability')
    expect(concepts).toHaveLength(8)
  })

  it('each concept has required shape fields', async () => {
    const engine = new PromptEngine('')
    const [concept] = await engine.generateConcepts(SURVEY_FULL, 1, 'gemini')
    expect(concept).toMatchObject({
      title: expect.any(String),
      concept: expect.any(String),
      imagePrompt: expect.any(String),
      negativePrompt: expect.any(String),
      themeCombo: expect.objectContaining({ primary: expect.any(String) }),
    })
  })
})

// ── Live path (mocked Anthropic) ─────────────────────────────────────────────

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  // Must be a regular function (not arrow) so `new Anthropic(...)` works
  function MockAnthropic() {
    return { messages: { create: mockCreate } }
  }
  return { default: MockAnthropic }
})

describe('PromptEngine — live path (mocked Anthropic)', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  function makeClaudeResponse(title: string) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            title,
            concept: 'A scene concept.',
            imagePrompt: 'portrait, dramatic lighting',
            negativePrompt: 'cartoon, blurry',
          }),
        },
      ],
    }
  }

  it('returns N concepts matching Claude responses', async () => {
    mockCreate
      .mockResolvedValueOnce(makeClaudeResponse('Fremen Warrior'))
      .mockResolvedValueOnce(makeClaudeResponse('Northern Wizard'))
      .mockResolvedValueOnce(makeClaudeResponse('Space Explorer'))

    const engine = new PromptEngine('test-api-key')
    const concepts = await engine.generateConcepts(SURVEY_FULL, 3, 'openai')

    expect(concepts).toHaveLength(3)
    expect(concepts[0].title).toBe('Fremen Warrior')
    expect(concepts[1].title).toBe('Northern Wizard')
    expect(concepts[2].title).toBe('Space Explorer')
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('falls back gracefully when Claude returns invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Here is your concept: a warrior...' }],
    })

    const engine = new PromptEngine('test-api-key')
    const [concept] = await engine.generateConcepts(SURVEY_FULL, 1, 'openai')

    expect(concept.title).toContain('Reimagined in')
    expect(concept.imagePrompt).toBeTruthy()
    expect(concept.negativePrompt).toBeTruthy()
  })

  it('appends style suffix to prompt when missing', async () => {
    mockCreate.mockResolvedValue(makeClaudeResponse('Epic Hero'))

    const engine = new PromptEngine('test-api-key')
    const survey: SurveyData = {
      ...SURVEY_FULL,
      moods: ['cinematic'],
      artStyle: 'photorealistic',
    }
    const [concept] = await engine.generateConcepts(survey, 1, 'openai')

    // The style suffix should be appended to the imagePrompt
    expect(concept.imagePrompt).toMatch(/cinematic|photorealistic|ultra-realistic/)
  })
})
