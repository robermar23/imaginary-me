/**
 * @fileoverview Provider factory — returns the configured ImageProvider
 * based on the AI_PROVIDER environment variable.
 * Also exports a dev-mode mock provider for use when no API keys are set.
 */

import { AI_CONFIG } from '@/config/ai-config'
import type { GenerationRequest, GenerationResult, ImageProvider } from '@/lib/ai/types'
import type { ProviderName } from '@/types'
import { GeminiProvider } from '@/lib/ai/providers/gemini'
import { OpenAIProvider } from '@/lib/ai/providers/openai'
import { StabilityProvider } from '@/lib/ai/providers/stability'

// ── Dev mock provider ─────────────────────────────────────────────────────────

/**
 * Returns a placeholder picsum image without calling any real AI API.
 * Used when no provider API key is configured.
 */
class MockProvider implements ImageProvider {
  readonly name: ProviderName = 'openai'
  readonly supportsImageInput = false
  readonly maxImagesPerCall = 1

  async generateImage(_request: GenerationRequest): Promise<GenerationResult> {
    // Use picsum for deterministic placeholder images in dev
    const seed = Math.floor(Math.random() * 1000)
    await new Promise((resolve) => setTimeout(resolve, 500)) // simulate latency
    return {
      rawUrl: `https://picsum.photos/seed/${seed}/1024/1024`,
      providerName: 'openai',
    }
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Returns an ImageProvider instance for the configured AI_PROVIDER.
 * Falls back to a mock provider when no API key is set (dev / CI mode).
 * @returns Configured ImageProvider.
 */
export function createImageProvider(): ImageProvider {
  const { provider } = AI_CONFIG

  switch (provider) {
    case 'openai': {
      const key = AI_CONFIG.openai.apiKey
      if (!key) {
        console.warn('[ai-factory] OPENAI_API_KEY not set — using mock provider')
        return new MockProvider()
      }
      return new OpenAIProvider(key)
    }

    case 'gemini': {
      const key = AI_CONFIG.gemini.apiKey
      if (!key) {
        console.warn('[ai-factory] GEMINI_API_KEY not set — using mock provider')
        return new MockProvider()
      }
      return new GeminiProvider(key)
    }

    case 'stability': {
      const key = AI_CONFIG.stability.apiKey
      if (!key) {
        console.warn('[ai-factory] STABILITY_API_KEY not set — using mock provider')
        return new MockProvider()
      }
      return new StabilityProvider(key)
    }

    default: {
      console.warn(`[ai-factory] Unknown provider "${String(provider)}" — using mock provider`)
      return new MockProvider()
    }
  }
}
