'use client'

/**
 * @fileoverview ResultsGallery — responsive grid of generated images with
 * download-all and session action controls.
 */

import { Sparkles } from 'lucide-react'
import { useSessionStore } from '@/store/session'
import { ImageCard } from '@/components/results/ImageCard'
import { DownloadAllButton } from '@/components/results/DownloadAllButton'
import { SessionActions } from '@/components/results/SessionActions'

/**
 * Responsive gallery grid for completed generation results.
 * @returns ResultsGallery element.
 */
export function ResultsGallery() {
  const generatedImages = useSessionStore((s) => s.generatedImages)
  const completedImages = generatedImages.filter((img) => img.status === 'complete')

  if (generatedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No images generated yet.</p>
      </div>
    )
  }

  const count = generatedImages.length
  const gridCols =
    count <= 2
      ? 'grid-cols-2'
      : count <= 4
        ? 'grid-cols-2 sm:grid-cols-2'
        : 'grid-cols-2 sm:grid-cols-3'

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-foreground">Your worlds await</h2>
        <p className="text-sm text-muted-foreground">
          {completedImages.length} of {count} images ready
        </p>
      </div>

      {/* Image grid */}
      <div className={`grid ${gridCols} gap-3`}>
        {generatedImages.map((image, index) => (
          <ImageCard key={image.id} image={image} index={index} />
        ))}
      </div>

      {/* Download all — only when at least one image is complete */}
      {completedImages.length > 0 && (
        <DownloadAllButton images={completedImages} />
      )}

      {/* Session navigation */}
      <SessionActions />
    </div>
  )
}
