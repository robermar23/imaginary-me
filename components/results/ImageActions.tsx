'use client'

/**
 * @fileoverview ImageActions — action buttons displayed in the ImageCard overlay.
 * Handles single-image download, regeneration trigger, and prompt view.
 */

import { useState } from 'react'
import { Download, RefreshCw, Info, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { CharacterCardButton } from '@/components/results/CharacterCardButton'
import type { GeneratedImage } from '@/types'

interface Props {
  image: GeneratedImage
  onRegenerate: () => void
  onViewPrompt: () => void
}

/**
 * Downloads a single image by fetching its bytes and triggering a browser download.
 * @param imageUrl - The image URL (Vercel Blob or data URL).
 * @param title - Used as the filename.
 */
async function downloadSingleImage(imageUrl: string, title: string): Promise<void> {
  let blob: Blob
  if (imageUrl.startsWith('data:')) {
    const [header, b64] = imageUrl.split(',')
    const mime = header.split(':')[1].split(';')[0]
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    blob = new Blob([bytes], { type: mime })
  } else {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error('Download failed')
    blob = await res.blob()
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png'
  a.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'imaginary-me'}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Overlay action buttons for a single image card.
 * @param image - The GeneratedImage being acted on.
 * @param onRegenerate - Callback to trigger regeneration.
 * @param onViewPrompt - Callback to open the prompt viewer.
 * @returns ImageActions element.
 */
export function ImageActions({ image, onRegenerate, onViewPrompt }: Props) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadSingleImage(image.imageUrl, image.title)
    } catch {
      toast.error('Download failed — please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Download */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        aria-label={downloading ? 'Downloading…' : 'Download image'}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <Download className="w-4 h-4" aria-hidden />
        )}
      </button>

      {/* Character Card export */}
      <CharacterCardButton image={image} />

      {/* Regenerate */}
      <button
        onClick={onRegenerate}
        aria-label="Regenerate image"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
      >
        <RefreshCw className="w-4 h-4" aria-hidden />
      </button>

      {/* View prompt */}
      {image.prompt && (
        <button
          onClick={onViewPrompt}
          aria-label="View prompt used for this image"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <Info className="w-4 h-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
