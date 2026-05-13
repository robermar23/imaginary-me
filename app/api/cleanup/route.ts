/**
 * @fileoverview POST /api/cleanup — deletes all Vercel Blob objects under a
 * session prefix. Called when the user clicks "Start Over" or on beforeunload.
 */

import type { NextRequest } from 'next/server'
import { list, del } from '@vercel/blob'
import type { CleanupRequest, CleanupResponse } from '@/types'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST /api/cleanup
 * Accepts JSON body `{ sessionId: string }` and deletes all blobs for that session.
 * @param request - Incoming Next.js request.
 * @returns JSON with count of deleted blobs.
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Support both JSON body (fetch) and plain text (sendBeacon sends text/plain)
  let sessionId: string | null = null

  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (body && typeof body === 'object' && 'sessionId' in body) {
      sessionId = (body as CleanupRequest).sessionId
    }
  } else {
    // sendBeacon sends as text/plain — try to parse as JSON
    try {
      const text = await request.text()
      const parsed = JSON.parse(text) as CleanupRequest
      sessionId = parsed.sessionId
    } catch {
      // Ignore parse errors from sendBeacon
    }
  }

  if (!sessionId || !UUID_RE.test(sessionId)) {
    return Response.json({ error: 'Missing or invalid sessionId' }, { status: 400 })
  }

  // Dev mode: no blob token set
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ deleted: 0 } satisfies CleanupResponse)
  }

  const prefix = `session/${sessionId}/`
  let deleted = 0

  // List and delete in pages (Vercel Blob list is paginated)
  let cursor: string | undefined
  do {
    const page = await list({ prefix, cursor, limit: 100 })
    if (page.blobs.length > 0) {
      await del(page.blobs.map((b) => b.url))
      deleted += page.blobs.length
    }
    cursor = page.cursor
  } while (cursor)

  return Response.json({ deleted } satisfies CleanupResponse)
}
