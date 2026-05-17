/**
 * @fileoverview POST /api/regenerate — regenerates a single image with a
 * pre-built prompt (same concept, new generation). Streams SSE events back.
 */

import type { NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import { AI_CONFIG } from '@/config/ai-config'
import { createImageProvider } from '@/lib/ai/factory'
import type { RegenerateRequest, StreamEvent } from '@/types'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateRequest(body: unknown): body is RegenerateRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.sessionId !== 'string' || !UUID_RE.test(b.sessionId)) return false
  if (typeof b.imageId !== 'string' || !b.imageId) return false
  if (typeof b.imageIndex !== 'number') return false
  if (typeof b.prompt !== 'string' || !b.prompt) return false
  if (typeof b.negativePrompt !== 'string') return false
  if (!Array.isArray(b.photoUrls)) return false
  return true
}

async function storeGeneratedImage(
  rawUrl: string,
  sessionId: string,
  index: number,
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return rawUrl

  let imageAb: ArrayBuffer
  let mimeType = 'image/png'

  if (rawUrl.startsWith('data:')) {
    const [header, b64] = rawUrl.split(',')
    mimeType = header.split(':')[1].split(';')[0]
    const buf = Buffer.from(b64, 'base64')
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

function encodeEvent(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

/**
 * POST /api/regenerate
 * Accepts a pre-built prompt and regenerates a single image.
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

  const { sessionId, imageId, imageIndex, prompt, negativePrompt, photoUrls } = body
  const imageProvider = createImageProvider()
  const referenceImageUrl = photoUrls[0] as string | undefined

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encodeEvent({ type: 'progress', index: imageIndex, status: 'generating' }))

      let imageUrl: string | null = null
      let lastError = ''

      try {
        const result = await imageProvider.generateImage({
          prompt,
          negativePrompt,
          referenceImageUrl,
          size: '1024x1024',
        })

        imageUrl = await storeGeneratedImage(result.rawUrl, sessionId, imageIndex)
      } catch (err) {
        lastError = String(err)
      }

      if (imageUrl) {
        controller.enqueue(
          encodeEvent({
            type: 'complete',
            index: imageIndex,
            imageUrl,
            title: imageId,
            prompt,
            negativePrompt,
          }),
        )
        controller.enqueue(encodeEvent({ type: 'done', total: 1, successCount: 1 }))
      } else {
        controller.enqueue(
          encodeEvent({ type: 'error', index: imageIndex, message: lastError || 'Regeneration failed' }),
        )
        controller.enqueue(encodeEvent({ type: 'done', total: 1, successCount: 0 }))
      }

      controller.close()
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
