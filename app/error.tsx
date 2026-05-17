'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Root error boundary — catches unhandled errors in the React tree.
 * @param error - The thrown error.
 * @param reset - Re-renders the boundary to attempt recovery.
 * @returns Error fallback UI.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[imaginary-me error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-error" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          An unexpected error occurred. Your session data is still intact — try
          again or go back to the start.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => (window.location.href = '/')}
        >
          Go home
        </Button>
      </div>
    </div>
  )
}
