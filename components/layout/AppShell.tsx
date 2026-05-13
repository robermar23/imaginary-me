'use client'

/**
 * @fileoverview Outer app chrome shown during the creation flow.
 * Renders the logo/header and wraps content in a centred, max-width container.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useSessionStore } from '@/store/session'
import { StepProgress } from '@/components/layout/StepProgress'
import type { AppStep } from '@/types'

const SURVEY_STEPS: readonly AppStep[] = [
  'survey-entertainment',
  'survey-dreams',
  'survey-aesthetic',
]

const STEP_LABELS: Record<string, string> = {
  'survey-entertainment': 'Step 1 of 3 — Entertainment',
  'survey-dreams': 'Step 2 of 3 — Dreams & Powers',
  'survey-aesthetic': 'Step 3 of 3 — Aesthetic',
  'photo-upload': 'Upload Photos',
  'generation-settings': 'Settings',
  'generating': 'Generating…',
  'results': 'Your Worlds',
}

interface Props {
  readonly children: React.ReactNode
}

/**
 * Shell layout for the creation flow.
 * Initialises the session and shows the header progress bar.
 * @param props - children to render inside the shell.
 * @returns Shell layout element.
 */
export function AppShell({ children }: Props) {
  const initializeSession = useSessionStore((s) => s.initializeSession)
  const currentStep = useSessionStore((s) => s.currentStep)

  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  const surveyIdx = SURVEY_STEPS.indexOf(currentStep as AppStep)
  const inSurvey = surveyIdx >= 0
  const stepLabel = STEP_LABELS[currentStep]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <Sparkles className="w-4 h-4 text-accent-violet" aria-hidden />
            <span className="font-semibold text-sm tracking-tight">imaginary me</span>
          </Link>

          {inSurvey && (
            <StepProgress
              total={SURVEY_STEPS.length}
              current={surveyIdx}
              label={stepLabel}
            />
          )}

          {!inSurvey && stepLabel && (
            <span className="text-xs text-muted-foreground font-medium">{stepLabel}</span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
