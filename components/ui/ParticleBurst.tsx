'use client'

import { useRef } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'

type ParticleShape = 'circle' | 'square' | 'streak'

interface ParticleConfig {
  readonly id: number
  readonly dx: number
  readonly dy: number
  readonly width: number
  readonly height: number
  readonly borderRadius: string
  readonly color: string
  readonly delay: number
  readonly duration: number
}

interface Props {
  /** Fixed viewport coordinates of the burst origin (button center). */
  origin: { x: number; y: number }
  /** Called after all particles finish animating — unmounts the portal. */
  onComplete: () => void
}

const PARTICLE_COUNT = 32

const COLORS = [
  '#6c47ff',
  '#8a6aff',
  '#00d4ff',
  '#40e0ff',
  'rgba(255,255,255,0.95)',
  '#c084fc',
  '#fbbf24',
] as const

function pickShape(i: number): ParticleShape {
  if (i % 5 === 0) return 'streak'
  if (i % 3 === 0) return 'square'
  return 'circle'
}

function buildParticles(): readonly ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + (Math.random() * 30 - 15)
    const speed = 180 + Math.random() * 220
    const rad = (angle * Math.PI) / 180
    const shape = pickShape(i)
    const baseSize = 6 + Math.random() * 12

    let width: number
    let height: number
    let borderRadius: string

    if (shape === 'streak') {
      width = baseSize * 3.5
      height = Math.max(3, baseSize * 0.4)
      borderRadius = `${height / 2}px`
    } else if (shape === 'square') {
      width = baseSize * 0.85
      height = baseSize * 0.85
      borderRadius = '3px'
    } else {
      width = baseSize
      height = baseSize
      borderRadius = '50%'
    }

    return {
      id: i,
      dx: Math.cos(rad) * speed,
      dy: Math.sin(rad) * speed,
      width,
      height,
      borderRadius,
      color: COLORS[i % COLORS.length],
      delay: Math.floor(Math.random() * 180),
      duration: 900 + Math.floor(Math.random() * 500),
    }
  })
}

/**
 * Renders 32 mixed-shape particles emanating from `origin` via a React portal
 * into `document.body`. Particles use circles, squares, and streak shapes with
 * varied sizes, colors, delays, and durations for a dramatic burst effect.
 * Calls `onComplete` when all particles have finished so the parent can unmount.
 * @param props.origin - Viewport-fixed {x, y} burst centre.
 * @param props.onComplete - Cleanup callback fired after the last particle ends.
 * @returns Portal element or null (SSR guard).
 */
export function ParticleBurst({ origin, onComplete }: Props) {
  const particles = useRef<readonly ParticleConfig[]>(buildParticles()).current
  const doneCount = useRef(0)

  if (typeof document === 'undefined') return null

  function handleAnimationEnd() {
    doneCount.current += 1
    if (doneCount.current >= PARTICLE_COUNT) {
      onComplete()
    }
  }

  const content = (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: 'fixed',
              left: origin.x - p.width / 2,
              top: origin.y - p.height / 2,
              width: p.width,
              height: p.height,
              borderRadius: p.borderRadius,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.width * 0.6}px ${p.color}`,
              ['--dx' as string]: `${p.dx}px`,
              ['--dy' as string]: `${p.dy}px`,
              animation: `particleOut ${p.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}ms both`,
            } as CSSProperties
          }
          onAnimationEnd={handleAnimationEnd}
        />
      ))}
    </div>
  )

  return createPortal(content, document.body)
}
