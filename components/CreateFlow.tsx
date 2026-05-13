'use client'

/**
 * @fileoverview Top-level create flow router.
 * Reads the ?step param and renders the correct step component.
 * Must be rendered inside a Suspense boundary (uses useSearchParams).
 */

import { useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { SurveyWizard } from '@/components/survey/SurveyWizard'
import { PhotoUpload } from '@/components/upload/PhotoUpload'
import { GenerationSettings } from '@/components/generation/GenerationSettings'
import { GenerationLoading } from '@/components/loading/GenerationLoading'

const SURVEY_STEPS = new Set([
  'survey-entertainment',
  'survey-dreams',
  'survey-aesthetic',
])

/**
 * Routes to the appropriate step component based on the URL query param.
 * @returns Current step component.
 */
export function CreateFlow() {
  const searchParams = useSearchParams()
  const step = searchParams.get('step') ?? 'survey-entertainment'

  if (SURVEY_STEPS.has(step)) {
    return <SurveyWizard />
  }

  if (step === 'photo-upload') {
    return <PhotoUpload />
  }

  if (step === 'generation-settings') {
    return <GenerationSettings />
  }

  if (step === 'generating') {
    return <GenerationLoading />
  }

  if (step === 'results') {
    return <ResultsPlaceholder />
  }

  // Default: show survey
  return <SurveyWizard />
}

function ResultsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">Results Gallery</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Your images are ready! Gallery coming in Sprint 4.
        </p>
      </div>
    </div>
  )
}
