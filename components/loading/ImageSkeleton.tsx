'use client'

/**
 * @fileoverview ImageSkeleton — animated shimmer card that fills a gallery
 * slot while its corresponding image is being generated. Transitions to the
 * real image when the `imageUrl` prop is set.
 */

import Image from 'next/image'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import type { GeneratedImageStatus } from '@/types'

interface Props {
  title: string
  imageUrl: string
  status: GeneratedImageStatus
  error?: string
}

/**
 * Renders an animated shimmer while `status` is pending/generating, then
 * reveals the image when complete, or an error state when failed.
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
      {/* Shimmer overlay for pending/generating states */}
      {!isComplete && !isError && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-surface via-surface-raised to-surface animate-pulse"
          aria-hidden
        />
      )}

      {/* Actual image (fades in when complete) */}
      {isComplete && imageUrl && (
        <Image
          src={imageUrl}
          alt={title || 'Generated image'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          unoptimized={imageUrl.startsWith('data:')}
        />
      )}

      {/* Generating label */}
      {isGenerating && title && (
        <div className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-xs text-white/90 font-medium leading-tight line-clamp-2">{title}</p>
        </div>
      )}

      {/* Complete checkmark badge */}
      {isComplete && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-success/90 flex items-center justify-center backdrop-blur-sm">
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
