'use client'

/**
 * @fileoverview Landing page hero — headline, sample gallery strip, CTA, trust signals.
 */

import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, ShieldCheck, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ExampleGallery } from '@/components/landing/ExampleGallery'

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
}

/**
 * Landing page hero section.
 * @returns Hero section element.
 */
export function HeroSection() {
  const router = useRouter()

  return (
    <section className="flex flex-col items-center text-center px-4 pt-16 pb-12 gap-8">

      {/* Logo mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 text-muted-foreground text-sm font-medium"
      >
        <Sparkles className="w-4 h-4 text-accent-violet" />
        imaginary me
      </motion.div>

      {/* Headline */}
      <motion.div
        custom={1}
        variants={FADE_UP}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3"
      >
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
          <span className="gradient-text">Reimagine yourself</span>
          <br />
          <span className="text-foreground">in infinite worlds</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
          Tell us what you love. Upload a photo.{' '}
          <span className="text-foreground">Discover who you could be.</span>
        </p>
      </motion.div>

      {/* Example worlds preview */}
      <motion.div
        custom={2}
        variants={FADE_UP}
        initial="hidden"
        animate="show"
      >
        <ExampleGallery />
      </motion.div>

      {/* CTA */}
      <motion.div
        custom={3}
        variants={FADE_UP}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center gap-4"
      >
        <Button
          size="lg"
          onClick={() => router.push('/create')}
          className="gradient-accent text-white font-semibold px-8 py-6 text-base rounded-xl border-0 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          Start Creating
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>

        {/* Trust signals */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            No sign up required
          </span>
          <span className="hidden sm:block text-border">·</span>
          <span className="flex items-center gap-1.5">
            <ImageOff className="w-3.5 h-3.5 text-success" />
            Your photos are never saved
          </span>
        </div>
      </motion.div>
    </section>
  )
}
