/**
 * @fileoverview Convenience hook for survey state operations.
 * Wraps the session store to provide a clean, survey-focused API.
 */

'use client'

import { useSessionStore } from '@/store/session'
import type { ArtStyle, Mood, TimePeriod } from '@/types'

/**
 * Returns survey data and all survey mutation actions from the session store.
 */
export function useSurvey() {
  const surveyData = useSessionStore((s) => s.surveyData)
  const setMovies = useSessionStore((s) => s.setMovies)
  const setBooks = useSessionStore((s) => s.setBooks)
  const setTvShows = useSessionStore((s) => s.setTvShows)
  const setSuperpower = useSessionStore((s) => s.setSuperpower)
  const setPlaces = useSessionStore((s) => s.setPlaces)
  const setTimePeriod = useSessionStore((s) => s.setTimePeriod)
  const setMoods = useSessionStore((s) => s.setMoods)
  const setArtStyle = useSessionStore((s) => s.setArtStyle)

  function toggleMood(mood: Mood): void {
    const current = [...surveyData.moods] as Mood[]
    const idx = current.indexOf(mood)
    if (idx >= 0) {
      current.splice(idx, 1)
      setMoods(current)
    } else if (current.length < 2) {
      setMoods([...current, mood])
    }
  }

  function selectTimePeriod(period: TimePeriod | undefined): void {
    setTimePeriod(period)
  }

  return {
    surveyData,
    setMovies,
    setBooks,
    setTvShows,
    setSuperpower,
    setPlaces,
    setTimePeriod: selectTimePeriod,
    setMoods,
    toggleMood,
    setArtStyle: (style: ArtStyle) => setArtStyle(style),
  }
}
