'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  onRevealComplete?: () => void
}

/**
 * Wraps children in a Polaroid-style development animation: starts desaturated
 * and overexposed, then a radial mask expands from centre as the image "develops".
 * Skips animation entirely when the user prefers reduced motion.
 * @param props.children - Content to reveal (should fill the wrapper absolutely).
 * @param props.onRevealComplete - Called when the animation finishes.
 * @returns Animated wrapper or plain fragment (reduced-motion).
 */
export function PolaroidReveal({ children, onRevealComplete }: Props) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <>{children}</>
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{ transform: 'translateZ(0)' }}
      initial={{
        filter: 'brightness(3) saturate(0) contrast(1.1)',
        scale: 0.97,
        clipPath: 'circle(0% at 50% 50%)',
      }}
      animate={{
        filter: 'brightness(1) saturate(1) contrast(1)',
        scale: 1,
        clipPath: 'circle(120% at 50% 50%)',
      }}
      transition={{
        duration: 2.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
        clipPath: { duration: 2.0, delay: 0.1 },
        scale: { duration: 2.5 },
        filter: { duration: 2.5 },
      }}
      onAnimationComplete={onRevealComplete}
    >
      {children}
    </motion.div>
  )
}
