'use client'

import { useRef } from 'react'
import { createPortal } from 'react-dom'

interface ParticleConfig {
  readonly id: number
  readonly dx: number
  readonly dy: number
  readonly size: number
  readonly color: string
  readonly delay: number
}

interface Props {
  /** Fixed viewport coordinates of the burst origin (button center). */
  origin: { x: number; y: number }
  /** Called after the last particle's animation completes — unmounts the portal. */
  onComplete: () => void
}

const COLORS = ['#6c47ff', '#00d4ff', 'rgba(255,255,255,0.9)'] as const

function buildParticles(): readonly ParticleConfig[] {
  return Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 360 + (Math.random() * 22 - 11)
    const speed = 60 + Math.random() * 60
    const rad = (angle * Math.PI) / 180
    return {
      id: i,
      dx: Math.cos(rad) * speed,
      dy: Math.sin(rad) * speed,
      size: 3 + Math.random() * 4,
      color: COLORS[i % COLORS.length],
      delay: Math.floor(Math.random() * 100),
    }
  })
}

/**
 * Renders 16 particles emanating from `origin` via a React portal into
 * `document.body`. Calls `onComplete` when the last particle finishes so the
 * parent can unmount this component and clean up the DOM nodes.
 * @param props.origin - Viewport-fixed {x, y} burst centre.
 * @param props.onComplete - Cleanup callback.
 * @returns Portal element or null (SSR guard).
 */
export function ParticleBurst({ origin, onComplete }: Props) {
  // Stable across renders — particles are generated once per mount
  const particles = useRef<readonly ParticleConfig[]>(buildParticles()).current

  if (typeof document === 'undefined') return null

  const content = (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'fixed',
            left: origin.x,
            top: origin.y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            animation: `particleOut 600ms ease-out ${p.delay}ms forwards`,
          } as React.CSSProperties}
          onAnimationEnd={p.id === 15 ? onComplete : undefined}
        />
      ))}
    </div>
  )

  return createPortal(content, document.body)
}
