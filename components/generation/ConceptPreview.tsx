'use client'

/**
 * @fileoverview ConceptPreview — shows a text list of upcoming themes derived
 * from the user's survey data. Static preview only; real Claude concepts are
 * not generated until the user clicks "Reimagine Me".
 */

import { Sparkles } from 'lucide-react'
import { useSessionStore } from '@/store/session'

const THEME_LABELS: Record<string, string> = {
  movies: 'Movie universe',
  books: 'Book world',
  tvShows: 'TV universe',
  places: 'Dream destination',
}

/** Returns a flat array of theme preview strings from the survey data. */
function getSampleThemes(
  survey: ReturnType<typeof useSessionStore.getState>['surveyData'],
  count: number,
): string[] {
  const items: string[] = []

  for (const m of survey.movies) items.push(`${m} universe`)
  for (const b of survey.books) items.push(`${b} world`)
  for (const t of survey.tvShows) items.push(`${t} universe`)
  for (const p of survey.places) items.push(`${p} adventure`)
  if (survey.superpower) items.push(`${survey.superpower} powers`)

  // Deduplicate and trim to count
  return [...new Set(items)].slice(0, count)
}

interface Props {
  count: number
}

/**
 * Renders a preview list of themes derived from survey data.
 * @param props.count - Number of images the user selected.
 * @returns ConceptPreview element.
 */
export function ConceptPreview({ count }: Props) {
  const surveyData = useSessionStore((s) => s.surveyData)
  const themes = getSampleThemes(surveyData, count)

  if (themes.length === 0) return null

  const visible = themes.slice(0, 4)
  const remaining = count - visible.length

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface border border-border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Your worlds will include
      </p>
      <ul className="flex flex-col gap-1.5">
        {visible.map((theme) => (
          <li key={theme} className="flex items-center gap-2 text-sm text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-accent-violet shrink-0" aria-hidden />
            {theme}
          </li>
        ))}
        {remaining > 0 && (
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden />
            …and {remaining} more surprise{remaining !== 1 ? 's' : ''}
          </li>
        )}
      </ul>
    </div>
  )
}

// Silence unused import warning for THEME_LABELS — it documents the mapping
void THEME_LABELS
