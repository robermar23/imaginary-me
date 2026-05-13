/**
 * @fileoverview Stability AI provider.
 * Uses the Stability AI REST API (SDXL) for text-to-image and img2img generation.
 * No official Node SDK — uses fetch directly.
 */

import { AI_CONFIG } from '@/config/ai-config'
import type { GenerationRequest, GenerationResult, ImageProvider } from '@/lib/ai/types'

const STABILITY_API_BASE = 'https://api.stability.ai/v1/generation'

interface StabilityArtifact {
  base64: string
  seed: number
  finishReason: 'SUCCESS' | 'ERROR' | 'CONTENT_FILTERED'
}

interface StabilityResponse {
  artifacts: StabilityArtifact[]
}

/**
 * Fetches an image URL and returns its bytes as an ArrayBuffer.
 * @param url - The image URL (data URL or remote URL).
 * @returns Image bytes and MIME type.
 */
async function fetchImageBytes(url: string): Promise<{ bytes: ArrayBuffer; mimeType: string }> {
  if (url.startsWith('data:')) {
    const [header, b64] = url.split(',')
    const mimeType = header.split(':')[1].split(';')[0]
    const buf = Buffer.from(b64, 'base64')
    // Slice to a plain ArrayBuffer (Buffer.buffer may be SharedArrayBuffer)
    const bytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    return { bytes, mimeType }
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
  return { bytes: await res.arrayBuffer(), mimeType }
}

/**
 * Stability AI provider using SDXL text-to-image and img2img endpoints.
 */
export class StabilityProvider implements ImageProvider {
  readonly name = 'stability' as const
  readonly supportsImageInput = true
  readonly maxImagesPerCall = 1

  private readonly apiKey: string

  /** @param apiKey - Stability AI API key. */
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Generates one image via Stability AI. When a reference photo is available,
   * uses img2img for better face consistency.
   * @param request - Generation parameters.
   * @returns Raw generation result with base64 data URL.
   */
  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    if (request.referenceImageUrl) {
      return this.img2img(request)
    }
    return this.textToImage(request)
  }

  private async textToImage(request: GenerationRequest): Promise<GenerationResult> {
    const cfg = AI_CONFIG.stability
    const url = `${STABILITY_API_BASE}/${cfg.engine}/text-to-image`

    const body = {
      text_prompts: [
        { text: request.prompt, weight: 1 },
        ...(request.negativePrompt
          ? [{ text: request.negativePrompt, weight: -1 }]
          : [{ text: 'cartoon, blurry, low quality, multiple people, text, watermark', weight: -1 }]),
      ],
      cfg_scale: cfg.cfgScale,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: cfg.steps,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    return this.parseResponse(res)
  }

  private async img2img(request: GenerationRequest): Promise<GenerationResult> {
    const cfg = AI_CONFIG.stability
    const url = `${STABILITY_API_BASE}/${cfg.engine}/image-to-image`

    const { bytes, mimeType } = await fetchImageBytes(request.referenceImageUrl!)

    const formData = new FormData()
    formData.append('init_image', new Blob([bytes], { type: mimeType }), 'reference.jpg')
    formData.append('init_image_mode', 'IMAGE_STRENGTH')
    formData.append('image_strength', String(cfg.imageStrength))
    formData.append(
      'text_prompts[0][text]',
      `Transform this person: ${request.prompt}. Maintain their facial features and identity.`,
    )
    formData.append('text_prompts[0][weight]', '1')
    if (request.negativePrompt) {
      formData.append('text_prompts[1][text]', request.negativePrompt)
      formData.append('text_prompts[1][weight]', '-1')
    }
    formData.append('cfg_scale', String(cfg.cfgScale))
    formData.append('samples', '1')
    formData.append('steps', String(cfg.steps))

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    })

    return this.parseResponse(res)
  }

  private async parseResponse(res: Response): Promise<GenerationResult> {
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Stability AI error ${res.status}: ${err}`)
    }

    const data = (await res.json()) as StabilityResponse
    const artifact = data.artifacts[0]
    if (!artifact) throw new Error('Stability AI returned no artifacts')

    if (artifact.finishReason === 'ERROR') {
      throw new Error('Stability AI generation error')
    }
    if (artifact.finishReason === 'CONTENT_FILTERED') {
      throw new Error('CONTENT_POLICY: Stability AI filtered this content')
    }

    return {
      rawUrl: `data:image/png;base64,${artifact.base64}`,
      providerName: 'stability',
    }
  }
}
