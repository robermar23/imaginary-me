'use client'

/**
 * @fileoverview GenerationLoading — full loading screen shown while the AI
 * pipeline runs. Reads generated images from the Zustand store and renders
 * a grid of ImageSkeleton cards that reveal as each image completes via SSE.
 */

import { useSessionStore } from '@/store/session'
import { useGeneration } from '@/hooks/useGeneration'
import { ImageSkeleton } from '@/components/loading/ImageSkeleton'
import { StatusMessage } from '@/components/loading/StatusMessage'

/**
 * Renders the generation progress grid + status message.
 * Updates automatically as SSE events arrive.
 * @returns GenerationLoading element.
 */
export function GenerationLoading() {
  const generatedImages = useSessionStore((s) => s.generatedImages)
  const { generating, completedCount, currentTitle, error } = useGeneration()

  const totalCount = generatedImages.length
  const colClass =
    totalCount <= 2
      ? 'grid-cols-2'
      : totalCount <= 4
        ? 'grid-cols-2'
        : 'grid-cols-2 sm:grid-cols-3'

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-foreground">Creating your worlds…</h2>
        <p className="text-sm text-muted-foreground">
          Your AI portraits are being crafted. This takes 20–60 seconds.
        </p>
      </div>

      {/* Image grid */}
      {totalCount > 0 && (
        <div className={`grid ${colClass} gap-3`} role="list" aria-label="Generation progress">
          {generatedImages.map((img, i) => (
            <div key={img.id} role="listitem">
              <ImageSkeleton
                title={img.title}
                imageUrl={img.imageUrl}
                status={img.status}
                error={img.error}
              />
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="flex flex-col gap-2">
          <div
            className="h-1.5 bg-surface-raised rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
          >
            <div
              className="h-full gradient-accent transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Status text */}
      <StatusMessage
        currentTitle={currentTitle}
        completedCount={completedCount}
        totalCount={totalCount}
      />

      {/* Top-level error (e.g. rate limit, network failure) */}
      {error && !generating && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Go back to adjust your settings and try again.
          </p>
        </div>
      )}
    </div>
  )
}
