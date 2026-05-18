'use client'

/**
 * @fileoverview Survey Step 2: Superpower wish, dream places, and time period preference.
 */

import { useSessionStore } from '@/store/session'
import { InterestTagInput } from '@/components/survey/InterestTagInput'
import { SingleSelect, type SelectOption } from '@/components/survey/SingleSelect'
import {
  PLACE_SUGGESTIONS,
  PLACE_QUICK_PICKS,
  SUPERPOWER_SUGGESTIONS,
  SUPERPOWER_QUICK_PICKS,
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
        <InterestTagInput
          label="Superpower you wish you had"
          hint="Pick one or type your own"
          value={superpower ? [superpower] : []}
          onChange={(tags) => setSuperpower(tags[0])}
          suggestions={SUPERPOWER_SUGGESTIONS}
          quickPicks={SUPERPOWER_QUICK_PICKS}
          max={1}
          placeholder="e.g. Teleportation, Time travel…"
        />

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
