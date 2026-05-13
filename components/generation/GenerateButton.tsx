'use client'

/**
 * @fileoverview GenerateButton — primary CTA that triggers image generation.
 * Shows an animated loading state while generation is in progress.
 */

import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onClick: () => void
  loading: boolean
  disabled?: boolean
}

/**
 * Styled primary CTA button for the generation step.
 * @param props.onClick - Called when the user clicks Generate.
 * @param props.loading - When true, shows a spinner and disables interaction.
 * @param props.disabled - Extra disabled condition (e.g. no photos uploaded).
 * @returns GenerateButton element.
 */
export function GenerateButton({ onClick, loading, disabled }: Props) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full gap-2.5 gradient-accent text-white border-0 hover:opacity-90 transition-opacity disabled:opacity-40 text-base font-semibold py-6"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          Generating your worlds…
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" aria-hidden />
          Reimagine Me
        </>
      )}
    </Button>
  )
}
