'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import type { CSSProperties, RefObject } from 'react'

interface TiltState {
  rotateX: number
  rotateY: number
  glareX: number
  glareY: number
  isHovering: boolean
}

interface UseCardTiltOptions {
  /** Max rotation in degrees. Default: 15. */
  intensity?: number
  /** Max glare alpha. Default: 0.15. */
  glareOpacity?: number
  /** Disable tilt entirely (e.g. during regeneration). */
  disabled?: boolean
}

export interface UseCardTiltReturn {
  tiltRef: RefObject<HTMLDivElement | null>
  tiltStyle: CSSProperties
  glareStyle: CSSProperties
  isHovering: boolean
}

const INITIAL_TILT: TiltState = {
  rotateX: 0,
  rotateY: 0,
  glareX: 50,
  glareY: 50,
  isHovering: false,
}

/**
 * Returns a ref + computed styles for a 3-D perspective tilt effect driven by
 * mouse position. Automatically disabled on coarse-pointer (touch) devices and
 * when the `disabled` option is true.
 * @param options - Tilt configuration.
 * @returns Ref, tiltStyle, glareStyle, and isHovering state.
 */
export function useCardTilt({
  intensity = 15,
  glareOpacity = 0.15,
  disabled = false,
}: UseCardTiltOptions = {}): UseCardTiltReturn {
  const tiltRef = useRef<HTMLDivElement | null>(null)
  const [tilt, setTilt] = useState<TiltState>(INITIAL_TILT)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = tiltRef.current
      if (!el) return
      const { left, top, width, height } = el.getBoundingClientRect()
      const x = (e.clientX - left) / width - 0.5
      const y = (e.clientY - top) / height - 0.5
      setTilt({
        rotateX: y * -intensity,
        rotateY: x * intensity,
        glareX: ((e.clientX - left) / width) * 100,
        glareY: ((e.clientY - top) / height) * 100,
        isHovering: true,
      })
    },
    [intensity],
  )

  const handleMouseLeave = useCallback(() => {
    setTilt(INITIAL_TILT)
  }, [])

  useEffect(() => {
    const el = tiltRef.current
    if (!el || disabled) return

    // Skip on touch devices — no hover semantics
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [disabled, handleMouseMove, handleMouseLeave])

  const isHovering = tilt.isHovering

  const shadowX = -tilt.rotateY * 0.5
  const shadowY = tilt.rotateX * 0.5

  const tiltStyle: CSSProperties = {
    transform: `perspective(600px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
    transition: isHovering ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
    willChange: 'transform',
    boxShadow: [
      `${shadowX}px ${shadowY}px 25px rgba(108, 71, 255, 0.15)`,
      `${shadowX * 0.6}px ${shadowY * 0.6}px 50px rgba(0, 0, 0, 0.4)`,
    ].join(', '),
  }

  const glareStyle: CSSProperties = {
    background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,${glareOpacity}) 0%, transparent 60%)`,
    mixBlendMode: 'overlay',
    pointerEvents: 'none',
    transition: isHovering ? 'background 0.08s ease-out' : 'background 0.4s ease-out',
  }

  return { tiltRef, tiltStyle, glareStyle, isHovering }
}
