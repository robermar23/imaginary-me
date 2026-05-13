'use client'

/**
 * @fileoverview Single uploaded photo preview with a remove button.
 */

import { X } from 'lucide-react'
import type { UploadedPhoto } from '@/types'

interface Props {
  readonly photo: UploadedPhoto
  /** Called when the user removes this photo. */
  readonly onRemove: () => void
}

/**
 * Renders a square thumbnail of an uploaded photo with an accessible remove button.
 * @param props - Component props.
 * @returns Thumbnail element.
 */
export function PhotoThumbnail({ photo, onRemove }: Props) {
  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.previewUrl}
        alt="Uploaded photo preview"
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Remove overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        type="button"
        onClick={onRemove}
        className={[
          'absolute top-1 right-1 w-5 h-5 rounded-full',
          'bg-black/70 flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet',
        ].join(' ')}
        aria-label="Remove photo"
      >
        <X className="w-3 h-3 text-white" aria-hidden />
      </button>
    </div>
  )
}
