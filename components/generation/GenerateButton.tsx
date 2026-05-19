'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { BurstButton } from '@/components/ui/BurstButton'

interface Props {
  onClick: () => void
  loading: boolean
  disabled?: boolean
}

/**
 * Styled primary CTA button for the generation step.
 * Fires a particle burst from the button centre on click, then calls onClick.
 * @param props.onClick - Called when the user clicks Generate.
 * @param props.loading - When true, shows a spinner and disables interaction.
 * @param props.disabled - Extra disabled condition (e.g. no photos uploaded).
 * @returns GenerateButton element.
 */
export function GenerateButton({ onClick, loading, disabled }: Props) {
  return (
    <BurstButton
      size="lg"
      onBurstClick={onClick}
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
    </BurstButton>
  )
}
