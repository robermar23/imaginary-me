/**
 * @fileoverview Google Gemini / Imagen 3 provider.
 * Uses the Imagen 3 REST API for text-to-image generation.
 * When a reference photo is available, uses Gemini vision to extract an
 * appearance description and injects it into the Imagen prompt.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG } from '@/config/ai-config'
import type { GenerationRequest, GenerationResult, ImageProvider } from '@/lib/ai/types'

const IMAGEN_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Calls the Gemini vision model to produce a physical appearance description
 * from the reference photo, used for face-consistency injection.
 * @param genAI - GoogleGenerativeAI client.
 * @param referenceImageUrl - Data URL or remote URL of the reference photo.
 * @returns Appearance description string.
 */
async function describeAppearance(
  genAI: GoogleGenerativeAI,
  referenceImageUrl: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: AI_CONFIG.gemini.visionModel })

  let imagePart: { inlineData: { mimeType: string; data: string } }

  if (referenceImageUrl.startsWith('data:')) {
    const [header, b64] = referenceImageUrl.split(',')
    const mimeType = header.split(':')[1].split(';')[0]
    imagePart = { inlineData: { mimeType, data: b64 } }
  } else {
    const res = await fetch(referenceImageUrl)
    const buffer = await res.arrayBuffer()
    const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
    imagePart = {
      inlineData: {
        mimeType,
        data: Buffer.from(buffer).toString('base64'),
      },
    }
  }

  const result = await model.generateContent([
    imagePart,
    'Describe this person\'s physical appearance in a factual, detailed way for use in an image generation prompt. Include: approximate age range, gender presentation, hair color and style, eye color if visible, skin tone, and any distinctive features. Keep it to 2-3 sentences. Focus only on appearance, not background.',
  ])

  return result.response.text()
}

/**
 * Calls the Imagen 3 REST API directly.
 * @param apiKey - Google AI API key.
 * @param prompt - Text prompt.
 * @returns Base64-encoded PNG image as a data URL.
 */
async function callImagen3(apiKey: string, prompt: string): Promise<string> {
  const url = `${IMAGEN_API_BASE}/${AI_CONFIG.gemini.imageModel}:predict?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1' },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Imagen 3 API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as {
    predictions?: Array<{ bytesBase64Encoded: string; mimeType: string }>
  }

  const prediction = data.predictions?.[0]
  if (!prediction?.bytesBase64Encoded) throw new Error('Imagen 3 returned no image data')

  const mime = prediction.mimeType ?? 'image/png'
  return `data:${mime};base64,${prediction.bytesBase64Encoded}`
}

/**
 * Google Imagen 3 provider.
 * Does not support direct image input — uses Gemini vision for appearance
 * description injection instead.
 */
export class GeminiProvider implements ImageProvider {
  readonly name = 'gemini' as const
  readonly supportsImageInput = false // uses description injection instead
  readonly maxImagesPerCall = 1

  private readonly genAI: GoogleGenerativeAI
  private readonly apiKey: string

  /** @param apiKey - Google AI (Gemini / Imagen) API key. */
  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  /**
   * Generates one image via Imagen 3. When a reference photo URL is provided,
   * prepends an appearance description to the prompt for face consistency.
   * @param request - Generation parameters.
   * @returns Raw generation result with base64 data URL.
   */
  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, referenceImageUrl } = request
    let finalPrompt = prompt

    if (referenceImageUrl) {
      try {
        const appearance = await describeAppearance(this.genAI, referenceImageUrl)
        finalPrompt = `A person who looks like: ${appearance} — depicted as: ${prompt}`
      } catch {
        // Continue with original prompt if appearance description fails
      }
    }

    const rawUrl = await callImagen3(this.apiKey, finalPrompt)
    return { rawUrl, providerName: 'gemini' }
  }
}
