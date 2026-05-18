'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'
import { useSessionStore } from '@/store/session'
import { useCardTilt } from '@/hooks/useCardTilt'
import { PolaroidReveal } from '@/components/ui/PolaroidReveal'
import { ImageActions } from '@/components/results/ImageActions'
import { PromptViewer } from '@/components/results/PromptViewer'
import type { GeneratedImage } from '@/types'

interface Props {
  image: GeneratedImage
  index: number
}

/**
 * Single result image card with 3-D tilt, Polaroid reveal, and overlay actions.
 * @param image - The GeneratedImage to display.
 * @param index - Position index used for regeneration storage path.
 * @returns ImageCard element.
 */
export function ImageCard({ image, index }: Props) {
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const sessionId = useSessionStore((s) => s.sessionId)
  const uploadedPhotos = useSessionStore((s) => s.uploadedPhotos)
  const updateImage = useSessionStore((s) => s.updateImage)

  const { tiltRef, tiltStyle, glareStyle, isHovering } = useCardTilt({
    intensity: 15,
    disabled: image.status !== 'complete' || regenerating,
  })

  const handleRegenerate = useCallback(async () => {
    if (regenerating || !image.prompt) return
    setRegenerating(true)
    setOverlayVisible(false)
    updateImage(image.id, { status: 'generating', imageUrl: '' })

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          imageId: image.id,
          imageIndex: index,
          prompt: image.prompt,
          negativePrompt: image.negativePrompt ?? 'cartoon, blurry, low quality, multiple people, text, watermark',
          photoUrls: uploadedPhotos.map((p) => p.url),
        }),
      })

      if (!response.ok || !response.body) {
        updateImage(image.id, { status: 'error', error: 'Regeneration failed' })
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          for (const line of part.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            try {
              const event = JSON.parse(trimmed.slice(6)) as {
                type: string
                imageUrl?: string
                prompt?: string
                negativePrompt?: string
              }
              if (event.type === 'complete' && event.imageUrl) {
                updateImage(image.id, {
                  imageUrl: event.imageUrl,
                  status: 'complete',
                  error: undefined,
                })
              }
              if (event.type === 'error') {
                updateImage(image.id, { status: 'error', error: 'Regeneration failed' })
              }
            } catch {
              // ignore malformed SSE events
            }
          }
        }
      }
    } catch {
      updateImage(image.id, { status: 'error', error: 'Regeneration failed' })
    } finally {
      setRegenerating(false)
    }
  }, [regenerating, image, index, sessionId, uploadedPhotos, updateImage])

  // ── Pending / generating skeleton ─────────────────────────────────────────
  if (image.status === 'pending' || image.status === 'generating' || regenerating) {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface to-[#1a1a28]" />
        {image.title && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-xs text-white/70 truncate">{image.title}</p>
          </div>
        )}
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (image.status === 'error') {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-red-900/50 flex flex-col items-center justify-center gap-2 p-3">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p className="text-xs text-muted-foreground text-center">Generation failed</p>
        {image.error && (
          <p className="text-[10px] text-red-400/70 text-center leading-tight line-clamp-3 break-all">
            {image.error}
          </p>
        )}
        {image.prompt && (
          <button
            onClick={handleRegenerate}
            aria-label="Regenerate this image"
            className="text-xs text-accent-violet hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  // ── Complete state ────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={tiltRef}
        role="button"
        tabIndex={0}
        aria-label={`${image.title || 'Generated image'} — tap to show actions`}
        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
        style={tiltStyle}
        onMouseEnter={() => setOverlayVisible(true)}
        onMouseLeave={() => setOverlayVisible(false)}
        onClick={() => setOverlayVisible((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOverlayVisible((v) => !v)
        }}
      >
        {/* Specular glare overlay — follows cursor, GPU compositor only */}
        {isHovering && (
          <div
            aria-hidden
            className="absolute inset-0 z-10 rounded-xl pointer-events-none"
            style={glareStyle}
          />
        )}

        {/* Polaroid development reveal — keyed on imageUrl so it re-fires on regeneration */}
        <PolaroidReveal key={image.imageUrl}>
          <Image
            src={image.imageUrl}
            alt={image.title || 'Generated image'}
            fill
            className="object-cover"
            unoptimized={image.imageUrl.startsWith('data:')}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </PolaroidReveal>

        {/* Title bar always visible */}
        {image.title && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
            <p className="text-xs text-white/90 font-medium truncate">{image.title}</p>
          </div>
        )}

        {/* Action overlay — visible on hover (desktop) or tap (mobile) */}
        <div
          className={`absolute inset-0 z-30 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${
            overlayVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <ImageActions
            image={image}
            onRegenerate={handleRegenerate}
            onViewPrompt={() => {
              setOverlayVisible(false)
              setPromptOpen(true)
            }}
          />
        </div>
      </div>

      {/* Prompt viewer modal */}
      {promptOpen && (
        <PromptViewer
          title={image.title}
          prompt={image.prompt}
          negativePrompt={image.negativePrompt}
          onClose={() => setPromptOpen(false)}
        />
      )}
    </>
  )
}
