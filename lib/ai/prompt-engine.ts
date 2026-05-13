/**
 * @fileoverview PromptEngine — uses Claude as a creative director to convert
 * survey data into vivid, provider-optimised image generation concepts.
 */

import Anthropic from '@anthropic-ai/sdk'
import { AI_CONFIG } from '@/config/ai-config'
import type { ArtStyle, ImageConcept, Mood, ProviderName, SurveyData, ThemeCombination } from '@/types'

// ── Style descriptors ─────────────────────────────────────────────────────────

const MOOD_DESCRIPTORS: Record<Mood, string> = {
  cinematic: 'cinematic lighting, dramatic composition, film grain, widescreen',
  dreamy: 'soft focus, pastel tones, ethereal light, bokeh, painterly',
  dark: 'dark atmosphere, moody lighting, deep shadows, noir aesthetic',
  vibrant: 'vivid colors, high saturation, dynamic energy, bold palette',
  gritty: 'gritty realism, weathered textures, harsh lighting, documentary style',
  surreal: 'surreal dreamlike quality, impossible geometry, metaphysical atmosphere',
}

const ART_STYLE_DESCRIPTORS: Record<ArtStyle, string> = {
  photorealistic: 'ultra-realistic, photographic, 8K, DSLR quality',
  painted: 'oil painting style, brushstrokes visible, Renaissance portrait',
  anime: 'anime art style, Studio Ghibli influence, cel shading',
  concept_art: 'concept art, ArtStation trending, digital painting, matte painting',
  surprise: '',
}

// ── Theme pool builder ────────────────────────────────────────────────────────

/**
 * Builds a flat list of theme items from survey data.
 * Each item has a source label (e.g. "movie", "place") for cross-category mixing.
 */
function buildThemePool(survey: SurveyData): Array<{ value: string; source: string }> {
  const pool: Array<{ value: string; source: string }> = []
  for (const m of survey.movies) pool.push({ value: m, source: 'movie' })
  for (const b of survey.books) pool.push({ value: b, source: 'book' })
  for (const t of survey.tvShows) pool.push({ value: t, source: 'TV show' })
  for (const p of survey.places) pool.push({ value: p, source: 'dream destination' })
  if (survey.superpower) pool.push({ value: survey.superpower, source: 'superpower' })
  if (survey.timePeriod) pool.push({ value: survey.timePeriod, source: 'time period' })
  return pool
}

/**
 * Selects N diverse ThemeCombination objects from the pool.
 * Prefers cross-category combinations and ensures each major theme is covered.
 * @param survey - User survey data.
 * @param count - Number of concepts to generate.
 * @returns Array of theme combinations.
 */
function selectThemeCombinations(survey: SurveyData, count: number): ThemeCombination[] {
  const pool = buildThemePool(survey)
  if (pool.length === 0) {
    return Array.from({ length: count }, () => ({
      primary: 'generic adventure',
    }))
  }

  const combos: ThemeCombination[] = []
  const usedPrimary = new Set<string>()

  for (let i = 0; i < count; i++) {
    // Cycle through pool items, avoiding repeats as primary when possible
    const available = pool.filter((p) => !usedPrimary.has(p.value))
    const primaryItem = available.length > 0 ? available[i % available.length] : pool[i % pool.length]
    usedPrimary.add(primaryItem.value)

    const primary = `${primaryItem.value} (${primaryItem.source})`

    // Try to add a secondary from a different source category
    const secondaryCandidates = pool.filter(
      (p) => p.source !== primaryItem.source && p.value !== primaryItem.value,
    )
    const sec =
      secondaryCandidates.length > 0
        ? secondaryCandidates[(i * 3 + 1) % secondaryCandidates.length]
        : undefined
    const secondary = sec ? `${sec.value} (${sec.source})` : undefined

    // Add superpower as modifier in the first image if provided and not already primary
    const modifier =
      survey.superpower && !primary.includes('superpower') && i === 0
        ? `${survey.superpower} (superpower)`
        : undefined

    combos.push({ primary, secondary, modifier })
  }

  return combos
}

/**
 * Builds the style suffix applied to all prompts based on aesthetic survey choices.
 * @param survey - User survey data.
 * @returns Comma-separated style descriptor string.
 */
function buildStyleSuffix(survey: SurveyData): string {
  const parts: string[] = []
  for (const mood of survey.moods) {
    const desc = MOOD_DESCRIPTORS[mood]
    if (desc) parts.push(desc)
  }
  const styleDesc = ART_STYLE_DESCRIPTORS[survey.artStyle]
  if (styleDesc) parts.push(styleDesc)
  return parts.join(', ')
}

// ── Claude concept generation ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a creative director for an AI portrait studio that reimagines people in fantastical settings based on their interests.

Given a user's interests and a theme combination, create a vivid, specific image concept that:
- Transforms the subject person into a character/version that fits the theme
- Combines multiple interests in a surprising, delightful way
- Results in a portrait-oriented image (person is the clear subject)
- Adheres to safe content guidelines — avoid anything violent, sexual, or offensive

Respond with valid JSON only, no markdown fences:
{
  "title": "Short evocative title (max 6 words, e.g. 'Fremen Warrior of Arrakis')",
  "concept": "2-3 sentence description of the scene",
  "imagePrompt": "Detailed image generation prompt with comma-separated descriptors and style tags",
  "negativePrompt": "Things to avoid (e.g. cartoon, blurry, low quality, multiple people, text, watermark)"
}`

/**
 * Generates a single ImageConcept by asking Claude to describe a scene
 * combining the given theme combination with the user's aesthetic preferences.
 * @param client - Anthropic client.
 * @param combo - Theme combination to use.
 * @param survey - Full survey data for context.
 * @param styleSuffix - Pre-built style descriptor string.
 * @param provider - Target image provider, for prompt optimisation hints.
 * @returns Parsed ImageConcept.
 */
async function generateConceptFromTheme(
  client: Anthropic,
  combo: ThemeCombination,
  styleSuffix: string,
  provider: ProviderName,
): Promise<ImageConcept> {
  const comboDescription = [combo.primary, combo.secondary, combo.modifier]
    .filter(Boolean)
    .join(' + ')

  const userMessage = `
Theme combination: ${comboDescription}
Style preferences: ${styleSuffix || 'cinematic, high quality'}
Target image provider: ${provider}

Generate an image concept for a person to be reimagined in this theme.
`.trim()

  const message = await client.messages.create({
    model: AI_CONFIG.claude.model,
    max_tokens: AI_CONFIG.claude.maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  let parsed: { title: string; concept: string; imagePrompt: string; negativePrompt: string }
  try {
    parsed = JSON.parse(text) as typeof parsed
  } catch {
    // Fallback: Claude returned non-JSON despite instructions
    parsed = {
      title: `Reimagined in ${combo.primary}`,
      concept: text.slice(0, 200),
      imagePrompt: `portrait of a person in ${comboDescription}, ${styleSuffix}, high quality`,
      negativePrompt: 'cartoon, blurry, low quality, multiple people, text, watermark',
    }
  }

  // Append style suffix to the generated prompt if not already included
  const prompt = styleSuffix && !parsed.imagePrompt.includes(styleSuffix.split(',')[0])
    ? `${parsed.imagePrompt}, ${styleSuffix}`
    : parsed.imagePrompt

  return {
    title: parsed.title,
    concept: parsed.concept,
    imagePrompt: prompt,
    negativePrompt: parsed.negativePrompt,
    themeCombo: combo,
  }
}

// ── Mock concepts for dev mode ────────────────────────────────────────────────

function buildMockConcepts(count: number): ImageConcept[] {
  const themes = [
    'Fremen Warrior of Arrakis',
    'Northern Wizard',
    'Space Explorer',
    'Ancient Samurai',
    'Time-Travelling Adventurer',
    'Underwater Monarch',
    'Desert Nomad',
    'Cyberpunk Renegade',
  ]
  return Array.from({ length: count }, (_, i) => ({
    title: themes[i % themes.length],
    concept: `A reimagined portrait placing the subject in a fantastical ${themes[i % themes.length].toLowerCase()} setting.`,
    imagePrompt: `cinematic portrait, person as ${themes[i % themes.length].toLowerCase()}, dramatic lighting, high quality, detailed`,
    negativePrompt: 'cartoon, blurry, low quality, multiple people, text, watermark',
    themeCombo: { primary: themes[i % themes.length] },
  }))
}

// ── PromptEngine class ────────────────────────────────────────────────────────

/**
 * Converts survey answers into image generation concepts using Claude.
 */
export class PromptEngine {
  private readonly client: Anthropic | null

  /** @param apiKey - Anthropic API key. If absent, uses mock concepts. */
  constructor(apiKey: string) {
    this.client = apiKey ? new Anthropic({ apiKey }) : null
  }

  /**
   * Generates N unique image concepts from the user's survey data.
   * Falls back to mock concepts when ANTHROPIC_API_KEY is not set.
   * @param survey - User survey data.
   * @param count - Number of concepts to generate.
   * @param provider - Target image provider name.
   * @returns Array of ImageConcept objects.
   */
  async generateConcepts(
    survey: SurveyData,
    count: number,
    provider: ProviderName,
  ): Promise<ImageConcept[]> {
    if (!this.client) {
      return buildMockConcepts(count)
    }

    const combos = selectThemeCombinations(survey, count)
    const styleSuffix = buildStyleSuffix(survey)

    const concepts = await Promise.all(
      combos.map((combo) =>
        generateConceptFromTheme(this.client!, combo, styleSuffix, provider),
      ),
    )

    return concepts
  }
}
