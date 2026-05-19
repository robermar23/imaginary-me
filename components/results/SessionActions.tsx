'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dices, SlidersHorizontal, Camera, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/session'

/**
 * Navigation actions shown below the results gallery.
 * Includes a "Surprise Me" remix button plus adjust/photo/reset utilities.
 * @returns SessionActions element.
 */
export function SessionActions() {
  const router = useRouter()
  const sessionId = useSessionStore((s) => s.sessionId)
  const resetSession = useSessionStore((s) => s.resetSession)
  const remixCount = useSessionStore((s) => s.remixCount)
  const remixSurveyData = useSessionStore((s) => s.remixSurveyData)

  const [isRolling, setIsRolling] = useState(false)

  const handleSurpriseMe = useCallback(() => {
    setIsRolling(true)
    window.setTimeout(() => setIsRolling(false), 500)

    remixSurveyData()

    toast.success(
      remixCount >= 2
        ? 'Your imagination has no limits ✨'
        : '🎲 Interests shuffled! Hit Reimagine Me for your remix.',
      { duration: 3500 },
    )

    router.push('/create?step=generation-settings')
  }, [remixCount, remixSurveyData, router])

  function handleAdjustInterests() {
    router.push('/create?step=survey-entertainment')
  }

  function handleNewPhotos() {
    router.push('/create?step=photo-upload')
  }

  async function handleStartOver() {
    try {
      navigator.sendBeacon('/api/cleanup', JSON.stringify({ sessionId }))
    } catch {
      // best-effort — TTL will clean up
    }
    resetSession()
    router.push('/')
  }

  return (
    <div className="flex flex-col gap-4 pt-2 border-t border-border">
      {/* ── Surprise Me — featured remix action ── */}
      <Button
        onClick={handleSurpriseMe}
        className="w-full gap-2.5 bg-surface border border-accent-violet/40 text-foreground hover:border-accent-violet hover:bg-accent-violet/10 transition-colors"
        aria-label="Randomize interests and surprise me with a new remix"
      >
        <Dices
          className="w-4 h-4"
          style={{ animation: isRolling ? 'spinDice 500ms ease-out' : 'none' }}
          aria-hidden
        />
        Surprise Me
      </Button>

      {/* ── Utility actions ── */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground text-center">What would you like to do next?</p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handleAdjustInterests}
            className="gap-2 text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Adjust Interests
          </Button>

          <Button
            variant="outline"
            onClick={handleNewPhotos}
            className="gap-2 text-sm"
          >
            <Camera className="w-4 h-4" />
            New Photos
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={handleStartOver}
          className="gap-2 text-sm text-muted-foreground hover:text-foreground w-full"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over
        </Button>
      </div>
    </div>
  )
}
