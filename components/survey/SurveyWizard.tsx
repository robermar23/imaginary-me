'use client'

/**
 * @fileoverview SurveyWizard orchestrates the three-step survey flow.
 * Handles URL-based step state, prev/next navigation, and Zustand sync.
 */

import { useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/session'
import { selectHasMinimumSurvey } from '@/store/session'
import { EntertainmentStep } from '@/components/survey/steps/EntertainmentStep'
import { DreamsStep } from '@/components/survey/steps/DreamsStep'
import { AestheticStep } from '@/components/survey/steps/AestheticStep'
import type { AppStep } from '@/types'

// ── Step definitions ──────────────────────────────────────────────────────────

type SurveyAppStep = 'survey-entertainment' | 'survey-dreams' | 'survey-aesthetic'

const SURVEY_STEPS: readonly SurveyAppStep[] = [
  'survey-entertainment',
  'survey-dreams',
  'survey-aesthetic',
]

const STEP_COMPONENTS: Record<SurveyAppStep, React.ComponentType> = {
  'survey-entertainment': EntertainmentStep,
  'survey-dreams': DreamsStep,
  'survey-aesthetic': AestheticStep,
}

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
}

const SLIDE_TRANSITION = { type: 'tween' as const, duration: 0.28, ease: 'easeInOut' as const }

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidStep(s: string | null): s is SurveyAppStep {
  return SURVEY_STEPS.includes(s as SurveyAppStep)
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Multi-step survey wizard with URL-synced navigation and slide animations.
 * Must be rendered inside a Next.js Suspense boundary (uses useSearchParams).
 * @returns SurveyWizard element.
 */
export function SurveyWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToStep = useSessionStore((s) => s.goToStep)
  const hasMinimum = useSessionStore(selectHasMinimumSurvey)

  // Resolve current step from URL, default to first
  const rawStep = searchParams.get('step')
  const currentStep: SurveyAppStep = isValidStep(rawStep)
    ? rawStep
    : 'survey-entertainment'

  const stepIdx = SURVEY_STEPS.indexOf(currentStep)
  const isFirst = stepIdx === 0
  const isLast = stepIdx === SURVEY_STEPS.length - 1

  // Keep Zustand store in sync with URL step
  useEffect(() => {
    goToStep(currentStep as AppStep)
  }, [currentStep, goToStep])

  const navigate = useCallback(
    (step: SurveyAppStep) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('step', step)
      router.push(`/create?${params.toString()}`)
    },
    [router, searchParams],
  )

  function handleBack() {
    if (isFirst) {
      router.push('/')
      return
    }
    navigate(SURVEY_STEPS[stepIdx - 1])
  }

  function handleNext() {
    if (isLast) {
      // Advance to photo upload (Sprint 2)
      router.push('/create?step=photo-upload')
      return
    }
    navigate(SURVEY_STEPS[stepIdx + 1])
  }

  const StepComponent = STEP_COMPONENTS[currentStep]

  // Direction for slide animation: 1 = forward, -1 = backward
  const direction = 1

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Animated step content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SLIDE_TRANSITION}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {isFirst ? 'Home' : 'Back'}
        </Button>

        <div className="flex items-center gap-3">
          {isLast && !hasMinimum && (
            <p className="text-xs text-muted-foreground">
              Add at least one interest to continue
            </p>
          )}

          <Button
            onClick={handleNext}
            disabled={isLast && !hasMinimum}
            className="gap-2 gradient-accent text-white border-0 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isLast ? 'Upload Photos' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
