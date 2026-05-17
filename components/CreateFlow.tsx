'use client'

/**
 * @fileoverview Top-level create flow router.
 * Reads the ?step param and renders the correct step component.
 * Also registers a beforeunload handler to clean up Vercel Blob objects.
 * Must be rendered inside a Suspense boundary (uses useSearchParams).
 */

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { SurveyWizard } from '@/components/survey/SurveyWizard'
import { PhotoUpload } from '@/components/upload/PhotoUpload'
import { GenerationSettings } from '@/components/generation/GenerationSettings'
import { GenerationLoading } from '@/components/loading/GenerationLoading'
import { ResultsGallery } from '@/components/results/ResultsGallery'
import { useSessionStore } from '@/store/session'

const SURVEY_STEPS = new Set([
  'survey-entertainment',
  'survey-dreams',
  'survey-aesthetic',
])

const STEP_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' as const } },
}

/**
 * Routes to the appropriate step component based on the URL query param.
 * Wraps each step in AnimatePresence for fade+slide transitions.
 * @returns Current step component.
 */
export function CreateFlow() {
  const searchParams = useSearchParams()
  const step = searchParams.get('step') ?? 'survey-entertainment'
  const sessionId = useSessionStore((s) => s.sessionId)

  // Clean up Vercel Blob objects when the tab closes
  useEffect(() => {
    if (!sessionId) return
    function cleanup() {
      navigator.sendBeacon('/api/cleanup', JSON.stringify({ sessionId }))
    }
    window.addEventListener('beforeunload', cleanup)
    return () => window.removeEventListener('beforeunload', cleanup)
  }, [sessionId])

  let content: React.ReactNode

  if (SURVEY_STEPS.has(step)) {
    content = <SurveyWizard />
  } else if (step === 'photo-upload') {
    content = <PhotoUpload />
  } else if (step === 'generation-settings') {
    content = <GenerationSettings />
  } else if (step === 'generating') {
    content = <GenerationLoading />
  } else if (step === 'results') {
    content = <ResultsGallery />
  } else {
    content = <SurveyWizard />
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={step} {...STEP_TRANSITION}>
        {content}
      </motion.div>
    </AnimatePresence>
  )
}
