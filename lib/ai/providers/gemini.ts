/**
 * @fileoverview Google Gemini image generation provider.
 * Uses gemini-2.5-flash-image via generateContent with
 * responseModalities: ['IMAGE'] — works with a standard Gemini API key (billing required).
 * When a reference photo is provided, it is passed directly as inlineData alongside
 * the text prompt so the model can render the subject's likeness (same approach as AI Studio).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG } from '@/config/ai-config'
import type { GenerationRequest, GenerationResult, ImageProvider } from '@/lib/ai/types'

/**
 * Encodes a reference image URL (data URL or remote URL) into an inlineData part
 * suitable for inclusion in a Gemini generateContent request.
 * @param referenceImageUrl - Data URL or remote URL of the reference photo.
 * @returns An object with the inlineData part and its mimeType.
 */
async function encodeReferenceImage(
  referenceImageUrl: string,
): Promise<{ inlineData: { mimeType: string; data: string } }> {
  if (referenceImageUrl.startsWith('data:')) {
    const [header, b64] = referenceImageUrl.split(',')
    const mimeType = header.split(':')[1].split(';')[0]
    return { inlineData: { mimeType, data: b64 } }
  }

  const res = await fetch(referenceImageUrl)
  if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.status}`)
  const buffer = await res.arrayBuffer()
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
  return {
    inlineData: {
      mimeType,
      data: Buffer.from(buffer).toString('base64'),
    },
  }
}

/**
 * Google Gemini image generation provider.
 * Uses generateContent with responseModalities: ['IMAGE'] on
 * gemini-2.5-flash-image. When a reference photo is provided it is passed
 * directly as inlineData in the same request — this is how AI Studio achieves
 * subject-faithful results and what this provider replicates.
 */
export class GeminiProvider implements ImageProvider {
  readonly name = 'gemini' as const
  readonly supportsImageInput = true
  readonly maxImagesPerCall = 1

  private readonly genAI: GoogleGenerativeAI

  /** @param apiKey - Google AI (Gemini) API key. */
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  /**
   * Generates one image via Gemini native image generation.
   * When a reference photo URL is provided, it is included as inlineData so
   * the model renders the subject's likeness directly.
   * @param request - Generation parameters.
   * @returns Raw generation result with base64 data URL.
   */
  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, referenceImageUrl } = request

    const model = this.genAI.getGenerativeModel({
      model: AI_CONFIG.gemini.imageModel,
    })

    // Build the parts array — include reference image when available so the
    // model renders the person's likeness (mirrors what AI Studio does).
    type Part = { text: string } | { inlineData: { mimeType: string; data: string } }
    const parts: Part[] = []

    if (referenceImageUrl) {
      try {
        const imagePart = await encodeReferenceImage(referenceImageUrl)
        parts.push(imagePart)
        parts.push({
          text: `The person in the reference photo is the subject. Generate: ${prompt}`,
        })
      } catch {
        // Reference image failed to load — fall back to text-only prompt
        parts.push({ text: prompt })
      }
    } else {
      parts.push({ text: prompt })
    }

    // responseModalities is not yet in the SDK's GenerationConfig types
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } as object,
    })

    const responseParts = result.response.candidates?.[0]?.content?.parts ?? []
    const imagePart = responseParts.find(
      (p): p is typeof p & { inlineData: { mimeType: string; data: string } } =>
        'inlineData' in p && p.inlineData != null,
    )

    if (!imagePart) {
      const textParts = responseParts
        .filter((p) => 'text' in p)
        .map((p) => (p as { text: string }).text)
      throw new Error(
        `Gemini returned no image data. Text response: ${textParts.join(' ') || '(none)'}`,
      )
    }

    const { mimeType, data } = imagePart.inlineData
    return {
      rawUrl: `data:${mimeType ?? 'image/png'};base64,${data}`,
      providerName: 'gemini',
    }
  }
}
