'use client'

/**
 * @fileoverview Survey Step 1: Movies, books, and TV shows the user loves.
 */

import { useSessionStore } from '@/store/session'
import { InterestTagInput } from '@/components/survey/InterestTagInput'
import {
  MOVIE_SUGGESTIONS,
  BOOK_SUGGESTIONS,
  TV_SHOW_SUGGESTIONS,
  MOVIE_QUICK_PICKS,
  BOOK_QUICK_PICKS,
  TV_QUICK_PICKS,
} from '@/lib/data/suggestions'

/**
 * Step 1 of the survey: entertainment worlds.
 * @returns EntertainmentStep element.
 */
export function EntertainmentStep() {
  const movies = useSessionStore((s) => s.surveyData.movies)
  const books = useSessionStore((s) => s.surveyData.books)
  const tvShows = useSessionStore((s) => s.surveyData.tvShows)
  const setMovies = useSessionStore((s) => s.setMovies)
  const setBooks = useSessionStore((s) => s.setBooks)
  const setTvShows = useSessionStore((s) => s.setTvShows)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">
          What stories live in your head rent-free?
        </h2>
        <p className="text-muted-foreground text-sm">
          Add up to 5 of each — or skip any section entirely.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <InterestTagInput
          label="Favourite Movies"
          hint="Films you'd happily rewatch right now"
          value={movies as string[]}
          onChange={setMovies}
          suggestions={MOVIE_SUGGESTIONS}
          quickPicks={MOVIE_QUICK_PICKS}
          max={5}
          placeholder="Type a movie…"
        />

        <div className="border-t border-border" />

        <InterestTagInput
          label="Favourite Books"
          hint="Stories that changed how you see the world"
          value={books as string[]}
          onChange={setBooks}
          suggestions={BOOK_SUGGESTIONS}
          quickPicks={BOOK_QUICK_PICKS}
          max={5}
          placeholder="Type a book…"
        />

        <div className="border-t border-border" />

        <InterestTagInput
          label="Favourite TV Shows"
          hint="Series you'd recommend to anyone"
          value={tvShows as string[]}
          onChange={setTvShows}
          suggestions={TV_SHOW_SUGGESTIONS}
          quickPicks={TV_QUICK_PICKS}
          max={5}
          placeholder="Type a show…"
        />
      </div>
    </div>
  )
}
