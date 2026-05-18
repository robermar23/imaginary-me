'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { PolaroidReveal } from '@/components/ui/PolaroidReveal'
import type { GeneratedImageStatus } from '@/types'

interface Props {
  title: string
  imageUrl: string
  status: GeneratedImageStatus
  error?: string
}

/**
 * Renders an animated shimmer while `status` is pending/generating, then
 * reveals the image with a Polaroid development effect when complete,
 * or an error state when failed.
 * @param props.title - Concept title (shown when status is generating).
 * @param props.imageUrl - Generated image URL (shown when status is complete).
 * @param props.status - Current status of this image slot.
 * @param props.error - Error message (shown when status is error).
 * @returns ImageSkeleton element.
 */
export function ImageSkeleton({ title, imageUrl, status, error }: Props) {
  const isComplete = status === 'complete'
  const isError = status === 'error'
  const isGenerating = status === 'generating'

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border">
      <AnimatePresence mode="wait">
        {isComplete && imageUrl ? (
          <PolaroidReveal key={`revealed-${imageUrl}`}>
            <Image
              src={imageUrl}
              alt={title || 'Generated image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              unoptimized={imageUrl.startsWith('data:')}
            />
          </PolaroidReveal>
        ) : !isError ? (
          <motion.div
            key="shimmer"
            className="absolute inset-0 bg-gradient-to-r from-surface via-surface-raised to-surface animate-pulse"
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      {/* Generating label */}
      {isGenerating && title && (
        <div className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
          <p className="text-xs text-white/90 font-medium leading-tight line-clamp-2">{title}</p>
        </div>
      )}

      {/* Complete checkmark badge */}
      {isComplete && (
        <div className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-success/90 flex items-center justify-center backdrop-blur-sm">
          <CheckCircle2 className="w-4 h-4 text-white" aria-label="Complete" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" aria-hidden />
          <p className="text-xs text-red-400 leading-snug">{error || 'Generation failed'}</p>
        </div>
      )}
    </div>
  )
}
