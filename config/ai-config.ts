/**
 * @fileoverview AI provider configuration. All values are read from environment
 * variables at module load time (server-side only).
 */

import type { ProviderName } from '@/types'

export const AI_CONFIG = {
  provider: (process.env.AI_PROVIDER ?? 'openai') as ProviderName,

  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: 'gpt-image-1' as const,
    imageSize: '1024x1024' as const,
    imageQuality: 'standard' as const,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    imageModel: 'gemini-2.5-flash-image' as const,
    visionModel: 'gemini-2.0-flash' as const,
  },

  stability: {
    apiKey: process.env.STABILITY_API_KEY ?? '',
    engine: 'stable-diffusion-xl-1024-v1-0' as const,
    imageStrength: 0.65,
    steps: 30,
    cfgScale: 7,
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: 'claude-opus-4-7' as const,
    maxTokens: 1024,
  },

  generation: {
    defaultCount: 4,
    maxCount: 8,
    minCount: 1,
    concurrencyLimit: 3,
    sessionMaxRequests: 3,
    sessionMaxImages: 24,
  },

  storage: {
    photoTtlSeconds: 3600,
    generatedTtlSeconds: 86400,
  },
} as const
