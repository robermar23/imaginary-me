'use client'

/**
 * @fileoverview SessionActions — bottom-of-results navigation buttons.
 * Lets users adjust their interests, swap photos, or start completely over.
 */

import { useRouter } from 'next/navigation'
import { SlidersHorizontal, Camera, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/session'

/**
 * Navigation actions shown below the results gallery.
 * "Adjust Interests" goes back to survey (keeps photos).
 * "New Photos" goes back to upload (keeps survey).
 * "Start Over" resets the session.
 * @returns SessionActions element.
 */
export function SessionActions() {
  const router = useRouter()
  const sessionId = useSessionStore((s) => s.sessionId)
  const resetSession = useSessionStore((s) => s.resetSession)

  function handleAdjustInterests() {
    router.push('/create?step=survey-entertainment')
  }

  function handleNewPhotos() {
    router.push('/create?step=photo-upload')
  }

  async function handleStartOver() {
    // Fire-and-forget cleanup before resetting
    try {
      navigator.sendBeacon('/api/cleanup', JSON.stringify({ sessionId }))
    } catch {
      // Best-effort — TTL will clean up anyway
    }
    resetSession()
    router.push('/')
  }

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-border">
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
  )
}
