'use client'

/**
 * @fileoverview PromptViewer — modal overlay showing the image prompt used
 * for a generated image.
 */

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  prompt: string
  negativePrompt?: string
  onClose: () => void
}

/**
 * Full-screen modal displaying the prompt used to generate an image.
 * Closes on Escape key or clicking the backdrop.
 * @param title - Image concept title.
 * @param prompt - The positive image prompt.
 * @param negativePrompt - Optional negative prompt.
 * @param onClose - Callback to close the modal.
 * @returns PromptViewer element.
 */
export function PromptViewer({ title, prompt, negativePrompt, onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Prompt used</p>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close prompt viewer"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        {/* Positive prompt */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Image prompt</p>
          <p className="text-sm text-foreground leading-relaxed bg-background rounded-lg p-3 border border-border">
            {prompt}
          </p>
        </div>

        {/* Negative prompt */}
        {negativePrompt && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Negative prompt</p>
            <p className="text-sm text-muted-foreground leading-relaxed bg-background rounded-lg p-3 border border-border">
              {negativePrompt}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
