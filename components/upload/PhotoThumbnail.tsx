'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { UploadedPhoto } from '@/types'

type ScanPhase = 'scanning' | 'analyzing' | 'done'

interface Props {
  readonly photo: UploadedPhoto
  readonly onRemove: () => void
}

/**
 * Renders a square thumbnail of an uploaded photo with a theatrical scanner
 * effect on mount (beam → "ANALYZING" → done), then an accessible remove button.
 * @param props.photo - The uploaded photo to display.
 * @param props.onRemove - Called when the user removes this photo.
 * @returns Thumbnail element.
 */
export function PhotoThumbnail({ photo, onRemove }: Props) {
  const [scanPhase, setScanPhase] = useState<ScanPhase>('scanning')

  useEffect(() => {
    const t1 = window.setTimeout(() => setScanPhase('analyzing'), 1500)
    const t2 = window.setTimeout(() => setScanPhase('done'), 2400)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, []) // intentional empty deps — runs once per mount (once per upload)

  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.previewUrl}
        alt="Uploaded photo preview"
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Scanner beam — sweeps top-to-bottom during 'scanning' phase */}
      {scanPhase === 'scanning' && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent"
          style={{ animation: 'scanBeam 1.5s linear forwards' }}
        />
      )}

      {/* Dim overlay + analyzing text — during scanning and analyzing phases */}
      {scanPhase !== 'done' && (
        <div
          aria-hidden
          className="absolute inset-0 bg-black/50 flex items-end justify-center pb-1.5 rounded-xl"
        >
          {scanPhase === 'analyzing' && (
            <span className="text-[9px] font-mono tracking-widest text-accent-cyan scanner-type">
              ANALYZING
            </span>
          )}
        </div>
      )}

      {/* Remove overlay — only shown after scan completes */}
      {scanPhase === 'done' && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      )}

      {/* Remove button — only shown after scan completes */}
      {scanPhase === 'done' && (
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
      )}
    </div>
  )
}
