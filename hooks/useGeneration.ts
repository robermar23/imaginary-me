/**
 * @fileoverview useGeneration — triggers the AI pipeline and subscribes to
 * the SSE stream, updating the Zustand store as images complete.
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/session'
import type { GenerateRequest, GeneratedImage, StreamEvent } from '@/types'

export interface FetchConceptsOptions {
  readonly sessionId: string
  readonly surveyData: import('@/types').SurveyData
  readonly count: number
  readonly onSuccess: (concepts: readonly import('@/types').ImageConcept[]) => void
  readonly onError: (message: string) => void
}

export interface UseGenerationReturn {
  /** True while the SSE stream is open. */
  readonly generating: boolean
  /** Number of images completed so far (0 to imageCount). */
  readonly completedCount: number
  /** Title of the concept currently being generated, if any. */
  readonly currentTitle: string | null
  /** Top-level error (e.g. request rejected, network failure). */
  readonly error: string | null
  /** True while /api/concepts is fetching (concept vote pre-fetch). */
  readonly fetchingConcepts: boolean
  /**
   * Starts the generation pipeline.
   * Navigates to `/create?step=generating`, opens the SSE stream, and updates
   * the store as each image completes or errors.
   * @param count - Number of images to generate.
   */
  startGeneration(count: number): Promise<void>
  /**
   * Fetches concepts from /api/concepts without generating images.
   * Stub — fully implemented in Phase D.
   * @param opts - Session, survey, count, and callbacks.
   */
  fetchConcepts(opts: FetchConceptsOptions): Promise<void>
}

/**
 * Parses raw SSE text into StreamEvents. Handles multiple `data:` lines.
 * @param chunk - A decoded SSE text chunk.
 * @returns Array of parsed StreamEvent objects.
 */
function parseSseChunk(chunk: string): StreamEvent[] {
  const events: StreamEvent[] = []
  for (const line of chunk.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data: ')) continue
    try {
      events.push(JSON.parse(trimmed.slice(6)) as StreamEvent)
    } catch {
      // Ignore malformed events
    }
  }
  return events
}

/**
 * Builds the initial array of pending GeneratedImage placeholder objects.
 * Each image is identified by `pending-{index}` for in-place updates.
 * @param count - Number of images.
 * @returns Pending placeholder array.
 */
function buildPendingImages(count: number): GeneratedImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pending-${i}`,
    imageUrl: '',
    title: '',
    prompt: '',
    provider: 'openai' as const,
    status: 'pending' as const,
  }))
}

/**
 * Hook that manages the full generation lifecycle.
 * @returns Generation state and startGeneration action.
 */
export function useGeneration(): UseGenerationReturn {
  const router = useRouter()
  const abortRef = useRef<AbortController | null>(null)

  const [generating, setGenerating] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [currentTitle, setCurrentTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fetchingConcepts, setFetchingConcepts] = useState(false)

  const sessionId = useSessionStore((s) => s.sessionId)
  const surveyData = useSessionStore((s) => s.surveyData)
  const uploadedPhotos = useSessionStore((s) => s.uploadedPhotos)
  const startGenerationStore = useSessionStore((s) => s.startGeneration)
  const setGeneratedImages = useSessionStore((s) => s.setGeneratedImages)
  const updateImage = useSessionStore((s) => s.updateImage)

  const startGeneration = useCallback(
    async (count: number) => {
      if (generating) return

      setGenerating(true)
      setCompletedCount(0)
      setCurrentTitle(null)
      setError(null)

      // Seed the store with pending placeholder slots (keeps order stable during generation)
      setGeneratedImages(buildPendingImages(count))

      // Navigate to generating step
      router.push('/create?step=generating')
      startGenerationStore('active')

      const abort = new AbortController()
      abortRef.current = abort

      try {
        const photoUrls = uploadedPhotos.map((p) => p.url)
        const requestBody: GenerateRequest = { sessionId, surveyData, photoUrls, count }

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abort.signal,
        })

        if (!response.ok) {
          const data = (await response.json()) as { error?: string }
          throw new Error(data.error ?? `HTTP ${response.status}`)
        }

        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            for (const event of parseSseChunk(part)) {
              applyEvent(event)
            }
          }
        }

        router.push('/create?step=results')
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        setGenerating(false)
      }

      function applyEvent(event: StreamEvent): void {
        switch (event.type) {
          case 'concept':
            setCurrentTitle(event.title)
            updateImage(`pending-${event.index}`, { title: event.title })
            break

          case 'progress':
            updateImage(`pending-${event.index}`, { status: 'generating' })
            break

          case 'complete':
            updateImage(`pending-${event.index}`, {
              imageUrl: event.imageUrl,
              title: event.title,
              prompt: event.prompt,
              negativePrompt: event.negativePrompt,
              status: 'complete',
              backstory: event.backstory,
              seriesEra: event.seriesEra,
            })
            setCompletedCount((n) => n + 1)
            setCurrentTitle(null)
            break

          case 'error':
            if (event.index >= 0) {
              updateImage(`pending-${event.index}`, {
                status: 'error',
                error: event.message,
              })
            }
            break

          case 'retry':
            setCurrentTitle(`Retrying image ${event.index + 1}...`)
            break

          case 'done':
            setGenerating(false)
            break
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generating, router, sessionId, surveyData, uploadedPhotos, startGenerationStore, setGeneratedImages, updateImage],
  )

  // fetchConcepts stub — fully implemented in Phase D
  const fetchConcepts = useCallback(async (opts: FetchConceptsOptions): Promise<void> => {
    setFetchingConcepts(true)
    try {
      // Phase D: POST /api/concepts, parse response, call opts.onSuccess
      console.log('[fetchConcepts] stub — Phase D implements this', opts.sessionId)
      opts.onError('Concept fetch not yet implemented')
    } finally {
      setFetchingConcepts(false)
    }
  }, [])

  return { generating, completedCount, currentTitle, error, fetchingConcepts, startGeneration, fetchConcepts }
}
