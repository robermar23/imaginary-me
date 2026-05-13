'use client'

/**
 * @fileoverview GenerationSettings — final step before generation.
 * User picks image count via slider, previews upcoming themes, and triggers
 * the AI pipeline by clicking "Reimagine Me".
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConceptPreview } from '@/components/generation/ConceptPreview'
import { GenerateButton } from '@/components/generation/GenerateButton'
import { useGeneration } from '@/hooks/useGeneration'
import { useSessionStore } from '@/store/session'
import { AI_CONFIG } from '@/config/ai-config'
import toast from 'react-hot-toast'

const MIN = AI_CONFIG.generation.minCount
const MAX = AI_CONFIG.generation.maxCount
const DEFAULT = AI_CONFIG.generation.defaultCount

/**
 * Generation settings step: count slider, concept preview, and generate CTA.
 * @returns GenerationSettings element.
 */
export function GenerationSettings() {
  const router = useRouter()
  const [count, setCount] = useState<number>(DEFAULT)
  const { generating, error, startGeneration } = useGeneration()

  const uploadedPhotos = useSessionStore((s) => s.uploadedPhotos)
  const hasPhotos = uploadedPhotos.length > 0

  function handleBack() {
    router.push('/create?step=photo-upload')
  }

  async function handleGenerate() {
    if (!hasPhotos) {
      toast.error('Please upload at least one photo before generating.')
      return
    }
    await startGeneration(count)
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Heading */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold text-foreground">Ready to reimagine you?</h2>
        <p className="text-sm text-muted-foreground">
          Choose how many worlds to generate, then let the AI do the rest.
        </p>
      </div>

      {/* Image count slider */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface border border-border">
        <div className="flex items-center justify-between">
          <label htmlFor="image-count" className="text-sm font-medium text-foreground">
            Number of images
          </label>
          <span className="text-lg font-bold gradient-text">{count}</span>
        </div>

        <input
          id="image-count"
          type="range"
          min={MIN}
          max={MAX}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-[#6c47ff] cursor-pointer"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={count}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{MIN}</span>
          <span>{MAX}</span>
        </div>
      </div>

      {/* Concept preview */}
      <ConceptPreview count={count} />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Generate CTA */}
      <GenerateButton onClick={handleGenerate} loading={generating} disabled={!hasPhotos} />

      {/* Navigation — back only (Next = generate button) */}
      <div className="flex items-center pt-2 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={generating}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
    </div>
  )
}
