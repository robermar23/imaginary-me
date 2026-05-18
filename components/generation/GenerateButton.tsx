'use client'

import { useState, useCallback, useRef } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ParticleBurst } from '@/components/ui/ParticleBurst'

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
  const [isBursting, setIsBursting] = useState(false)
  const [burstOrigin, setBurstOrigin] = useState({ x: 0, y: 0 })
  // Ref on the wrapping div — Button is a @base-ui component and may not forward ref
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (disabled || loading) return
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (rect) {
      setBurstOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
      setIsBursting(true)
    }
    // Delay the actual generation trigger so the burst renders first
    window.setTimeout(() => onClick(), 80)
  }, [disabled, loading, onClick])

  return (
    <>
      <div ref={wrapperRef} className="w-full">
        <Button
          size="lg"
          onClick={handleClick}
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
      </div>

      {isBursting && (
        <ParticleBurst
          origin={burstOrigin}
          onComplete={() => setIsBursting(false)}
        />
      )}
    </>
  )
}
