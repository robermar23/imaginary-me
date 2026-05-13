/**
 * @fileoverview OpenAI image provider.
 * Uses gpt-image-1 for text-to-image and image editing (face reference).
 */

import OpenAI from 'openai'
import { AI_CONFIG } from '@/config/ai-config'
import type { GenerationRequest, GenerationResult, ImageProvider } from '@/lib/ai/types'

/**
 * Fetches a remote URL and returns a Blob for use as an OpenAI file input.
 * @param url - The image URL to fetch.
 * @returns A Blob containing the image bytes.
 */
async function fetchImageAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.status}`)
  return res.blob()
}

/**
 * OpenAI image provider using gpt-image-1.
 * When a referenceImageUrl is supplied and the API supports image editing,
 * uses the edits endpoint for better face consistency.
 */
export class OpenAIProvider implements ImageProvider {
  readonly name = 'openai' as const
  readonly supportsImageInput = true
  readonly maxImagesPerCall = 1

  private readonly client: OpenAI

  /** @param apiKey - OpenAI API key. */
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  /**
   * Generates one image, preferring the image-edit endpoint when a reference
   * photo is available for better face consistency.
   * @param request - Generation parameters.
   * @returns Raw generation result with b64_json data URL.
   */
  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    const { prompt, referenceImageUrl } = request
    const cfg = AI_CONFIG.openai

    if (referenceImageUrl) {
      return this.generateWithReference(prompt, referenceImageUrl, cfg)
    }
    return this.generateTextToImage(prompt, cfg)
  }

  private async generateTextToImage(
    prompt: string,
    cfg: typeof AI_CONFIG.openai,
  ): Promise<GenerationResult> {
    const response = await this.client.images.generate({
      model: cfg.model,
      prompt,
      n: 1,
      size: cfg.imageSize,
      response_format: 'b64_json',
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) throw new Error('OpenAI returned no image data')

    return {
      rawUrl: `data:image/png;base64,${b64}`,
      providerName: 'openai',
    }
  }

  private async generateWithReference(
    prompt: string,
    referenceImageUrl: string,
    cfg: typeof AI_CONFIG.openai,
  ): Promise<GenerationResult> {
    let imageBlob: Blob

    // Handle both data URLs (dev mode) and remote Vercel Blob URLs
    if (referenceImageUrl.startsWith('data:')) {
      const [header, b64] = referenceImageUrl.split(',')
      const mime = header.split(':')[1].split(';')[0]
      const bytes = Buffer.from(b64, 'base64')
      imageBlob = new Blob([bytes], { type: mime })
    } else {
      imageBlob = await fetchImageAsBlob(referenceImageUrl)
    }

    const imageFile = new File([imageBlob], 'reference.jpg', { type: imageBlob.type })

    const response = await this.client.images.edit({
      model: cfg.model,
      image: imageFile,
      prompt: `Transform this person: ${prompt}. Maintain their facial features, skin tone, and identity.`,
      n: 1,
      size: cfg.imageSize,
    })

    // gpt-image-1 edit returns b64_json
    const first = response.data?.[0]
    const b64 = (first as { b64_json?: string } | undefined)?.b64_json
    const url = first?.url
    if (!b64 && !url) throw new Error('OpenAI edit returned no image data')

    return {
      rawUrl: b64 ? `data:image/png;base64,${b64}` : url!,
      providerName: 'openai',
    }
  }
}
