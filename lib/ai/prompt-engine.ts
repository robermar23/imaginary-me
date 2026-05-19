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

const SYSTEM_PROMPT = `You are a creative director for an AI portrait studio that reimagines a specific real person in fantastical settings based on their interests.

A reference photo of the subject will be provided directly to the image generation model alongside your prompt. Your image prompt must treat that photo as the subject — describe only the costume, character role, setting, and mood. Do NOT describe the person's physical appearance (hair, skin, face, age) — the model will read those from the reference photo.

Given a theme combination, create a vivid, specific image concept that:
- Places THE SUBJECT (from the reference photo) into a character/setting that fits the theme
- Combines interests in a surprising, delightful way
- Results in a portrait-oriented image (the subject is the clear focus)
- Adheres to safe content guidelines — avoid anything violent, sexual, or offensive

For the imagePrompt field, start with "photorealistic portrait of the subject dressed as [character], [setting details], [mood and lighting], [style tags]" — never say "a person" or describe what they look like.

Respond with valid JSON only, no markdown fences:
{
  "title": "Short evocative title (max 6 words, e.g. 'Fremen Warrior of Arrakis')",
  "concept": "2-3 sentence description of the scene",
  "imagePrompt": "Detailed image generation prompt — starts with 'the subject dressed as / standing as / portrayed as', followed by costume, setting, lighting, style tags",
  "negativePrompt": "Things to avoid (e.g. cartoon, blurry, low quality, multiple people, text, watermark, different person)",
  "backstory": "2-3 sentence present-tense in-universe backstory about the subject in this character. Written directly to the viewer as 'you'. Max 120 words. No spoilers. No violence."
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

  let parsed: { title: string; concept: string; imagePrompt: string; negativePrompt: string; backstory: string }
  try {
    parsed = JSON.parse(text) as typeof parsed
    // Sanitize backstory: strip any markdown formatting Claude may add
    if (parsed.backstory) {
      parsed.backstory = parsed.backstory.replace(/\*\*|__|\*|_|#+/g, '').trim()
    }
  } catch {
    // Fallback: Claude returned non-JSON despite instructions
    parsed = {
      title: `Reimagined in ${combo.primary}`,
      concept: text.slice(0, 200),
      imagePrompt: `portrait of a person in ${comboDescription}, ${styleSuffix}, high quality`,
      negativePrompt: 'cartoon, blurry, low quality, multiple people, text, watermark',
      backstory: 'A legendary figure in a world shaped by your imagination.',
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
    backstory: parsed.backstory || 'A legendary figure in a world shaped by your imagination.',
    themeCombo: combo,
  }
}

// ── Mock concepts for dev mode ────────────────────────────────────────────────

const MOCK_BACKSTORIES: readonly string[] = [
  'You have walked the deep desert for thirty years, earning the trust of the Fremen through silence and sacrifice. Your stillsuit has crossed Harkonnen patrols more times than you can count. The desert does not kill you — it has simply agreed to wait.',
  'The northern winds have carried your name across three kingdoms since before the youngest king was born. You speak the old tongue and the mountains answer. Tonight, you ride to a council that has not met in a century.',
  'Your first step onto the station deck was fourteen years ago; you have not touched a planetary surface since. You know the voice of every engine in this fleet and the star maps live behind your eyes like a second sight.',
  'The blade you carry has a name older than the city you were born in. You have studied under seven masters and buried four of them. Your kata begin before dawn and the students call you relentless behind your back.',
  'You have seen the fall of empires that the history books have not yet named. Your coat holds sand from six centuries and the watch on your wrist runs backward by design. You are not lost — you are precisely where you need to be.',
  'The deep currents answer to your bloodline and the leviathans have sworn an oath your great-grandmother sealed in salt and storm. Three surface nations would sink their navies to earn your favour. You owe none of them anything.',
  'Every trade route in the southern reaches passes through agreements you negotiated in the old tongue. You carry water for three days and need only one. The caravans move when you say and rest when you signal.',
  'The corporation put a bounty on your interface codes two years ago. You have since walked through their most secure server room twice — once to confirm the map, once to make a point. You are not hiding. You are deciding when to move.',
]

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
    backstory: MOCK_BACKSTORIES[i % MOCK_BACKSTORIES.length],
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
   * Generates 6 concepts — one per TimePeriod — based on the user's primary interest.
   * Implemented fully in Phase C. Stub returns empty array.
   * @param _survey - User survey data.
   * @param _provider - Target image provider name.
   * @returns Empty array (stub — Phase C implements this).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateSeriesConcepts(_survey: SurveyData, _provider: ProviderName): Promise<ImageConcept[]> {
    return []
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
