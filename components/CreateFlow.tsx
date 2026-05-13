'use client'

/**
 * @fileoverview Top-level create flow router.
 * Reads the ?step param and renders the correct step component.
 * Must be rendered inside a Suspense boundary (uses useSearchParams).
 */

import { useSearchParams } from 'next/navigation'
import { Camera } from 'lucide-react'
import { SurveyWizard } from '@/components/survey/SurveyWizard'

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

  if (SURVEY_STEPS.has(step) || step === 'survey-entertainment') {
    return <SurveyWizard />
  }

  if (step === 'photo-upload') {
    return <PhotoUploadPlaceholder />
  }

  // Default: show survey
  return <SurveyWizard />
}

function PhotoUploadPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
        <Camera className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">Photo Upload</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Photo upload is coming in Sprint 2. Survey data has been saved to state.
        </p>
      </div>
    </div>
  )
}
