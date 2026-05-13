/**
 * @fileoverview AI provider interface and generation types.
 * All image providers implement ImageProvider to enable swap-in-place at config time.
 */

import type { ImageConcept, ProviderName } from '@/types'

// ── Provider interface ────────────────────────────────────────────────────────

export interface GenerationRequest {
  readonly prompt: string
  readonly negativePrompt?: string
  /** Vercel Blob URL of a reference profile photo (used for img2img providers). */
  readonly referenceImageUrl?: string
  readonly size: '1024x1024'
}

export interface GenerationResult {
  /**
   * Raw image data: either a data URL (`data:image/jpeg;base64,...`) returned
   * by the provider, or a remote URL that must be re-stored in Vercel Blob.
   */
  readonly rawUrl: string
  readonly providerName: ProviderName
}

export interface ImageProvider {
  readonly name: ProviderName
  /** Whether this provider can incorporate a reference photo for face consistency. */
  readonly supportsImageInput: boolean
  /** Max images per single API call (usually 1 for most providers). */
  readonly maxImagesPerCall: number
  /**
   * Generate a single image from the request.
   * @param request - Generation parameters.
   * @returns The raw generation result.
   */
  generateImage(request: GenerationRequest): Promise<GenerationResult>
}

// ── Prompt engine types ───────────────────────────────────────────────────────

export interface ImageConceptWithProvider extends ImageConcept {
  readonly providerOptimizedPrompt: string
}

// ── Rate limit state ──────────────────────────────────────────────────────────

export interface RateLimitState {
  requests: number
  images: number
  windowStart: number
}
