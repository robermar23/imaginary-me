'use client'

/**
 * @fileoverview Survey Step 2: Superpower wish, dream places, and time period preference.
 */

import { useSessionStore } from '@/store/session'
import { InterestTagInput } from '@/components/survey/InterestTagInput'
import { SingleSelect, type SelectOption } from '@/components/survey/SingleSelect'
import { QuickPicks } from '@/components/survey/QuickPicks'
import {
  PLACE_SUGGESTIONS,
  PLACE_QUICK_PICKS,
  SUPERPOWER_SUGGESTIONS,
} from '@/lib/data/suggestions'
import type { TimePeriod } from '@/types'

const TIME_PERIOD_OPTIONS: readonly SelectOption<TimePeriod>[] = [
  { value: 'ancient', label: 'Ancient World', icon: '🏛️', description: 'Egypt, Rome, Greece' },
  { value: 'medieval', label: 'Medieval', icon: '⚔️', description: 'Knights & castles' },
  { value: 'renaissance', label: 'Renaissance', icon: '🎨', description: 'Art & discovery' },
  { value: 'victorian', label: 'Victorian', icon: '🎩', description: 'Steam & mystery' },
  { value: 'modern', label: 'Modern', icon: '🌆', description: 'Now' },
  { value: 'future', label: 'Far Future', icon: '🚀', description: 'Space & technology' },
]

/**
 * Step 2 of the survey: dreams and powers.
 * @returns DreamsStep element.
 */
export function DreamsStep() {
  const superpower = useSessionStore((s) => s.surveyData.superpower)
  const places = useSessionStore((s) => s.surveyData.places)
  const timePeriod = useSessionStore((s) => s.surveyData.timePeriod)
  const setSuperpower = useSessionStore((s) => s.setSuperpower)
  const setPlaces = useSessionStore((s) => s.setPlaces)
  const setTimePeriod = useSessionStore((s) => s.setTimePeriod)

  function handleSuperpowerPick(value: string) {
    setSuperpower(value === superpower ? undefined : value)
  }

  function handleTimePeriod(value: TimePeriod) {
    setTimePeriod(value === timePeriod ? undefined : value)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">
          If the rules didn&apos;t apply…
        </h2>
        <p className="text-muted-foreground text-sm">
          Dream big — all of these are optional.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Superpower */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="superpower-input" className="text-sm font-medium text-foreground">
              Superpower you wish you had
            </label>
            {superpower && (
              <button
                type="button"
                onClick={() => setSuperpower(undefined)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <input
            id="superpower-input"
            type="text"
            value={superpower ?? ''}
            onChange={(e) => setSuperpower(e.target.value || undefined)}
            maxLength={100}
            placeholder="e.g. Teleportation, Time travel…"
            className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring/50 transition-colors"
          />
          <div className="mt-1">
            <p className="text-xs text-muted-foreground mb-1.5">Popular picks:</p>
            <QuickPicks
              suggestions={SUPERPOWER_SUGGESTIONS.slice(0, 9)}
              selected={superpower ? [superpower] : []}
              onSelect={handleSuperpowerPick}
              max={1}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Places */}
        <InterestTagInput
          label="Places you dream of visiting"
          hint="Real destinations or fantastical realms"
          value={places as string[]}
          onChange={setPlaces}
          suggestions={PLACE_SUGGESTIONS}
          quickPicks={PLACE_QUICK_PICKS}
          max={5}
          placeholder="Type a place…"
        />

        <div className="border-t border-border" />

        {/* Time period */}
        <SingleSelect<TimePeriod>
          label="Time period preference (optional)"
          options={TIME_PERIOD_OPTIONS}
          value={timePeriod ?? ''}
          onChange={handleTimePeriod}
        />
      </div>
    </div>
  )
}
