/**
 * @fileoverview POST /api/generate — validates a generation request, runs the
 * full AI pipeline (Claude prompt engine + image provider), and streams
 * Server-Sent Events back to the client as images complete.
 *
 * SSE event types (see types/index.ts → StreamEvent):
 *   concept   — a concept title has been generated
 *   progress  — an image has started generating
 *   complete  — an image finished; includes Vercel Blob URL
 *   error     — an individual image failed (generation continues for others)
 *   done      — all images finished
 *
 * Rate limiting (in-process, single-instance):
 *   Max 3 generation requests per session per 24 h window.
 *   Max 24 images total per session per 24 h window.
 *   Production deployments should replace this with Vercel KV.
 */

import type { NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import { AI_CONFIG } from '@/config/ai-config'
import { createImageProvider } from '@/lib/ai/factory'
import { PromptEngine } from '@/lib/ai/prompt-engine'
import type { RateLimitState } from '@/lib/ai/types'
import type { GenerateRequest, ImageConcept, StreamEvent } from '@/types'

export const dynamic = 'force-dynamic'

// ── Rate limiting (in-process) ────────────────────────────────────────────────
// For production multi-instance deployments, replace with Vercel KV.
const rateLimitMap = new Map<string, RateLimitState>()
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

function checkRateLimit(sessionId: string, count: number): { allowed: boolean; reason?: string } {
  const now = Date.now()
  let state = rateLimitMap.get(sessionId)

  if (!state || now - state.windowStart > WINDOW_MS) {
    state = { requests: 0, images: 0, windowStart: now }
  }

  if (state.requests >= AI_CONFIG.generation.sessionMaxRequests) {
    return { allowed: false, reason: 'Maximum generation requests per session reached' }
  }
  if (state.images + count > AI_CONFIG.generation.sessionMaxImages) {
    return { allowed: false, reason: 'Maximum images per session reached' }
  }

  state.requests += 1
  state.images += count
  rateLimitMap.set(sessionId, state)
  return { allowed: true }
}

// ── Input validation ──────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateRequest(body: unknown): body is GenerateRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.sessionId !== 'string' || !UUID_RE.test(b.sessionId)) return false
  if (!b.surveyData || typeof b.surveyData !== 'object') return false
  if (!Array.isArray(b.photoUrls)) return false
  if (typeof b.count !== 'number' || b.count < 1 || b.count > AI_CONFIG.generation.maxCount) return false
  return true
}

// ── Image storage ─────────────────────────────────────────────────────────────

/**
 * Stores a generated image to Vercel Blob (or returns the raw data URL in dev).
 * @param rawUrl - data URL or remote URL returned by the provider.
 * @param sessionId - Session ID used as the blob path prefix.
 * @param index - Index of this image in the current generation batch.
 * @returns A stable Vercel Blob URL, or the raw data URL in dev mode.
 */
async function storeGeneratedImage(
  rawUrl: string,
  sessionId: string,
  index: number,
): Promise<string> {
  const devMode = !process.env.BLOB_READ_WRITE_TOKEN

  if (devMode) return rawUrl

  // Fetch bytes if it's a remote URL; decode base64 if it's a data URL
  let imageAb: ArrayBuffer
  let mimeType = 'image/png'

  if (rawUrl.startsWith('data:')) {
    const [header, b64] = rawUrl.split(',')
    mimeType = header.split(':')[1].split(';')[0]
    const buf = Buffer.from(b64, 'base64')
    // Slice to a plain ArrayBuffer (Buffer.buffer may be SharedArrayBuffer)
    imageAb = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  } else {
    const res = await fetch(rawUrl)
    if (!res.ok) throw new Error(`Failed to fetch generated image: ${res.status}`)
    mimeType = res.headers.get('content-type') ?? 'image/png'
    imageAb = await res.arrayBuffer()
  }

  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'
  const id = randomUUID()
  const pathname = `session/${sessionId}/result-${index}-${id}.${ext}`

  const blob = await put(pathname, new Blob([imageAb], { type: mimeType }), {
    access: 'public',
    addRandomSuffix: false,
  })

  return blob.url
}

// ── Concurrency helper ────────────────────────────────────────────────────────

/**
 * Runs async tasks with a maximum concurrency of `limit`.
 * @param tasks - Array of zero-argument async functions.
 * @param limit - Maximum parallel executions.
 */
async function withConcurrency(
  tasks: Array<() => Promise<void>>,
  limit: number,
): Promise<void> {
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const i = nextIndex++
      await tasks[i]()
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  await Promise.all(workers)
}

// ── Content policy retry ──────────────────────────────────────────────────────

const CONTENT_POLICY_MARKER = 'CONTENT_POLICY'

/**
 * Softens a prompt by removing named characters / franchises and making it
 * more generic, used when a content policy error is encountered.
 * @param original - The original image prompt.
 * @returns A softened fallback prompt.
 */
function softenPrompt(original: string): string {
  return `${original.split(',').slice(0, 3).join(',')}, fantasy portrait, safe for work, high quality`
}

// ── SSE serialiser ────────────────────────────────────────────────────────────

function encodeEvent(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/generate
 * Accepts JSON body matching GenerateRequest, returns text/event-stream.
 * @param request - Incoming Next.js request.
 * @returns SSE streaming response.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!validateRequest(body)) {
    return Response.json({ error: 'Invalid request parameters' }, { status: 400 })
  }

  const { sessionId, surveyData, photoUrls, count } = body

  const rateCheck = checkRateLimit(sessionId, count)
  if (!rateCheck.allowed) {
    return Response.json({ error: rateCheck.reason }, { status: 429 })
  }

  const promptEngine = new PromptEngine(AI_CONFIG.claude.apiKey)
  const imageProvider = createImageProvider()
  const referenceImageUrl = photoUrls[0] as string | undefined

  const stream = new ReadableStream({
    async start(controller) {
      let successCount = 0

      try {
        // ── Step 1: Generate concepts ─────────────────────────────────────
        let concepts: ImageConcept[]
        try {
          concepts = await promptEngine.generateConcepts(surveyData, count, AI_CONFIG.provider)
        } catch (err) {
          controller.enqueue(
            encodeEvent({
              type: 'error',
              index: -1,
              message: `Failed to generate concepts: ${String(err)}`,
            }),
          )
          controller.close()
          return
        }

        // Emit concept events so UI can show titles immediately
        for (let i = 0; i < concepts.length; i++) {
          controller.enqueue(encodeEvent({ type: 'concept', index: i, title: concepts[i].title }))
        }

        // ── Step 2: Generate images in parallel ───────────────────────────
        const tasks = concepts.map((concept, i) => async () => {
          controller.enqueue(encodeEvent({ type: 'progress', index: i, status: 'generating' }))

          let imageUrl: string | null = null
          let lastError = ''

          for (let attempt = 1; attempt <= 2; attempt++) {
            const promptToUse =
              attempt === 1 ? concept.imagePrompt : softenPrompt(concept.imagePrompt)

            if (attempt === 2) {
              controller.enqueue(encodeEvent({ type: 'retry', index: i, attempt }))
            }

            try {
              const result = await imageProvider.generateImage({
                prompt: promptToUse,
                negativePrompt: concept.negativePrompt,
                // Always pass the reference URL — providers that don't support
                // direct image input (e.g. Gemini) still use it for appearance
                // description via vision, so withholding it breaks face reference.
                referenceImageUrl,
                size: '1024x1024',
              })

              imageUrl = await storeGeneratedImage(result.rawUrl, sessionId, i)
              break
            } catch (err) {
              lastError = String(err)
              console.error(`[generate] image ${i} attempt ${attempt} failed:`, err)
              if (!lastError.includes(CONTENT_POLICY_MARKER)) break // don't retry non-policy errors
            }
          }

          if (imageUrl) {
            successCount++
            controller.enqueue(
              encodeEvent({
                type: 'complete',
                index: i,
                imageUrl,
                title: concept.title,
                prompt: concept.imagePrompt,
                negativePrompt: concept.negativePrompt,
              }),
            )
          } else {
            controller.enqueue(
              encodeEvent({ type: 'error', index: i, message: lastError || 'Generation failed' }),
            )
          }
        })

        await withConcurrency(tasks, AI_CONFIG.generation.concurrencyLimit)
      } finally {
        controller.enqueue(
          encodeEvent({ type: 'done', total: count, successCount }),
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
