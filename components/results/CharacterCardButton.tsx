'use client'

/**
 * @fileoverview CharacterCardButton — triggers server-side character card PNG
 * generation and downloads the result to the user's device.
 */

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSessionStore } from '@/store/session'
import type { GeneratedImage } from '@/types'

interface Props {
  readonly image: GeneratedImage
}

/**
 * Icon button that POSTs to /api/character-card and triggers a PNG download.
 * Returns null when `image.backstory` is not set (card requires a backstory).
 * @param image - The GeneratedImage to export as a character card.
 * @returns CharacterCardButton element or null.
 */
export function CharacterCardButton({ image }: Props) {
  const [loading, setLoading] = useState(false)
  const surveyData = useSessionStore((s) => s.surveyData)

  if (!image.backstory) return null

  const interestTags = [
    ...surveyData.movies,
    ...surveyData.books,
    ...surveyData.tvShows,
  ]
    .filter(Boolean)
    .slice(0, 3)

  async function handleDownload() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/character-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image.imageUrl,
          title: image.title,
          backstory: image.backstory,
          interestTags,
          artStyle: surveyData.artStyle,
        }),
      })

      if (!res.ok) throw new Error('Character card generation failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const slug =
        image.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'character'
      a.download = `${slug}-character-card.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Character card export failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      aria-label={`Download character card for ${image.title}`}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
      ) : (
        <CreditCard className="w-4 h-4" aria-hidden />
      )}
    </button>
  )
}
