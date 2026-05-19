'use client'

import { useState, useRef, useCallback } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { Button } from '@/components/ui/button'
import { ParticleBurst } from '@/components/ui/ParticleBurst'

interface BurstButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  /** Called after the particle burst fires (with an 80ms delay so the burst renders first). */
  onBurstClick: () => void
}

/**
 * Wraps a Button with a particle burst effect centered on the button.
 * Orchestrates burst state so callers stay declarative.
 * @param props.onBurstClick - Action to invoke after the burst fires.
 * @returns BurstButton element.
 */
export function BurstButton({ onBurstClick, disabled, children, ...buttonProps }: BurstButtonProps) {
  const [isBursting, setIsBursting] = useState(false)
  const [burstOrigin, setBurstOrigin] = useState({ x: 0, y: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (disabled) return
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (rect) {
      setBurstOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      setIsBursting(true)
    }
    // Delay so the burst renders before the generation flow begins
    window.setTimeout(onBurstClick, 80)
  }, [disabled, onBurstClick])

  return (
    <>
      <div ref={wrapperRef} className="w-full">
        <Button {...buttonProps} disabled={disabled} onClick={handleClick}>
          {children}
        </Button>
      </div>

      {isBursting && (
        <ParticleBurst origin={burstOrigin} onComplete={() => setIsBursting(false)} />
      )}
    </>
  )
}
