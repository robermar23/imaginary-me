'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { UploadedPhoto } from '@/types'

interface Props {
  readonly photo: UploadedPhoto
  readonly onRemove: () => void
}

interface ScannerOverlayProps {
  onDone: () => void
}

/**
 * CSS-driven scan sequence: beam sweeps → "ANALYZING" appears → overlay fades out.
 * Calls `onDone` when the overlay animation ends so the parent can reveal controls.
 */
function ScannerOverlay({ onDone }: ScannerOverlayProps) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-black/50 rounded-xl scanner-overlay"
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) onDone()
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent"
        style={{ animation: 'scanBeam 1.5s linear forwards' }}
      />
      <div className="absolute inset-0 flex items-end justify-center pb-1.5">
        <span className="text-[9px] font-mono tracking-widest text-accent-cyan scanner-analyzing-text scanner-type">
          ANALYZING
        </span>
      </div>
    </div>
  )
}

/**
 * Renders a square thumbnail of an uploaded photo with a theatrical scanner
 * effect on mount, then an accessible remove button.
 * @param props.photo - The uploaded photo to display.
 * @param props.onRemove - Called when the user removes this photo.
 * @returns Thumbnail element.
 */
export function PhotoThumbnail({ photo, onRemove }: Props) {
  const [hasFinishedIntro, setHasFinishedIntro] = useState(false)

  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.previewUrl}
        alt="Uploaded photo preview"
        className="w-full h-full object-cover"
        draggable={false}
      />

      {!hasFinishedIntro && (
        <ScannerOverlay onDone={() => setHasFinishedIntro(true)} />
      )}

      {/* Remove overlay — always mounted, activates after intro */}
      <div
        className={[
          'absolute inset-0 transition-colors',
          hasFinishedIntro ? 'bg-black/0 group-hover:bg-black/30' : 'bg-black/0',
        ].join(' ')}
      />

      {/* Remove button — always mounted, focusable */}
      <button
        type="button"
        onClick={onRemove}
        className={[
          'absolute top-1 right-1 w-5 h-5 rounded-full',
          'bg-black/70 flex items-center justify-center',
          'transition-opacity',
          hasFinishedIntro
            ? 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
            : 'opacity-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet',
        ].join(' ')}
        aria-label="Remove photo"
      >
        <X className="w-3 h-3 text-white" aria-hidden />
      </button>
    </div>
  )
}
