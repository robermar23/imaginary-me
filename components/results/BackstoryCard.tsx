'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  readonly backstory: string
  readonly title: string
  readonly isOpen: boolean
  readonly onClose: () => void
}

interface ContentProps {
  readonly backstory: string
  readonly title: string
  readonly onClose: () => void
}

/**
 * Inner content shared by both the full flip and the reduced-motion fallback.
 */
function BackstoryContent({ backstory, title, onClose }: ContentProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[9px] font-mono tracking-widest text-accent-cyan uppercase">
          Character Lore
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close backstory"
          className="flex-shrink-0 p-0.5 rounded hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
        </button>
      </div>
      <p className="text-xs font-semibold text-foreground leading-snug">{title}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed flex-1 overflow-y-auto">
        {backstory}
      </p>
    </>
  )
}

/**
 * Flip-card backstory overlay rendered inside `ImageCard`.
 * Activates with a Framer Motion `rotateY` 3D flip; falls back to an opacity
 * fade when the user prefers reduced motion.
 * @param props.backstory - The in-universe backstory text.
 * @param props.title - Character title displayed on the back face.
 * @param props.isOpen - Whether the back face is currently visible.
 * @param props.onClose - Called when the user dismisses the card.
 * @returns Overlay element or null when closed.
 */
export function BackstoryCard({ backstory, title, isOpen, onClose }: Props) {
  const prefersReduced = useReducedMotion()

  if (!isOpen) return null

  if (prefersReduced) {
    return (
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Character backstory"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 z-40 bg-[#0a0a0f]/95 rounded-xl flex flex-col p-4 gap-3"
      >
        <BackstoryContent backstory={backstory} title={title} onClose={onClose} />
      </motion.div>
    )
  }

  return (
    <div
      className="absolute inset-0 z-40"
      style={{ perspective: '800px' }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        initial={{ rotateY: -180 }}
        animate={{ rotateY: 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0.0, 0.2, 1] as const }}
      >
        {/* Back face — visible after flip completes */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Character backstory"
          className="absolute inset-0 rounded-xl bg-[#0a0a0f]/97 flex flex-col p-4 gap-3"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <BackstoryContent backstory={backstory} title={title} onClose={onClose} />
        </div>
      </motion.div>
    </div>
  )
}
