'use client'

/**
 * @fileoverview ExampleGallery — three example "world" cards shown on the
 * landing page. Uses gradient placeholder cards; swap in real images by
 * placing example-1.jpg / example-2.jpg / example-3.jpg in /public.
 */

import Image from 'next/image'
import { motion } from 'framer-motion'

interface ExampleCard {
  src: string | null
  label: string
  gradient: string
}

const EXAMPLES: readonly ExampleCard[] = [
  {
    src: null, // swap to '/example-1.jpg' once images are available
    label: 'Dune + Japan',
    gradient: 'from-amber-900/80 via-orange-800/60 to-yellow-900/80',
  },
  {
    src: null,
    label: 'Harry Potter + Iceland + Dark',
    gradient: 'from-indigo-900/80 via-purple-800/60 to-slate-900/80',
  },
  {
    src: null,
    label: 'Avatar + Teleportation',
    gradient: 'from-cyan-900/80 via-teal-800/60 to-blue-900/80',
  },
]

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
}

/**
 * Grid of three example world cards.
 * @returns ExampleGallery element.
 */
export function ExampleGallery() {
  return (
    <div
      className="w-full max-w-sm sm:max-w-lg grid grid-cols-3 gap-2"
      aria-label="Example imaginary worlds"
    >
      {EXAMPLES.map(({ src, label, gradient }, i) => (
        <motion.div
          key={label}
          custom={i}
          variants={CARD_VARIANTS}
          initial="hidden"
          animate="show"
          className={`relative rounded-xl overflow-hidden aspect-[3/4] border border-border`}
        >
          {src ? (
            <Image
              src={src}
              alt={`Example world: ${label}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 180px"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} aria-hidden />
          )}

          {/* Bottom overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <p className="absolute bottom-0 left-0 right-0 p-2 text-[10px] text-white/90 leading-tight font-medium">
            {label}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
