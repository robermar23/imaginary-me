/**
 * @fileoverview POST /api/upload — accepts resized profile photos, stores them
 * temporarily in Vercel Blob, and returns the blob URLs for the generation step.
 *
 * Validations performed server-side:
 *   - sessionId UUID format (prevents path traversal)
 *   - max 3 files per request
 *   - max 2 MB per file (client should have already resized to ≤ 1024 px)
 *   - MIME type: image/jpeg | image/png | image/webp
 *   - Magic-bytes check (first bytes match declared MIME type)
 *
 * Dev fallback: when BLOB_READ_WRITE_TOKEN is absent the route echoes the file
 * as a data URL so the full upload UI can be tested without Vercel credentials.
 */

import type { NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import type { UploadResponse } from '@/types'

export const dynamic = 'force-dynamic'

const MAX_FILES = 3
const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB post-resize
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validates the leading bytes of a buffer against the declared MIME type.
 * Prevents content-type spoofing (e.g. an .exe renamed to .jpg).
 * @param bytes - File bytes.
 * @param mime - Declared MIME type.
 * @returns True when bytes are consistent with the declared type.
 */
function hasValidMagicBytes(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (mime === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a
    )
  }
  if (mime === 'image/webp') {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
  }
  return false
}

function ext(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

/**
 * POST /api/upload
 * Accepts multipart/form-data with fields: sessionId (string), photos (File[]).
 * @param request - Incoming Next.js request.
 * @returns JSON with upload results or an error message.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid multipart request' }, { status: 400 })
  }

  const sessionId = formData.get('sessionId')
  if (typeof sessionId !== 'string' || !UUID_RE.test(sessionId)) {
    return Response.json({ error: 'Missing or invalid sessionId' }, { status: 400 })
  }

  const rawFiles = formData.getAll('photos')
  const files = rawFiles.filter((f): f is File => f instanceof File)

  if (files.length === 0) {
    return Response.json({ error: 'No files provided' }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return Response.json(
      { error: `Maximum ${MAX_FILES} photos per request` },
      { status: 400 },
    )
  }

  const uploads: UploadResponse['uploads'][number][] = []
  const devMode = !process.env.BLOB_READ_WRITE_TOKEN

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const label = `Photo ${i + 1}`

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { error: `${label}: unsupported type — use JPG, PNG, or WebP` },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return Response.json(
        { error: `${label}: exceeds ${MAX_FILE_BYTES / (1024 * 1024)} MB` },
        { status: 400 },
      )
    }

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    if (!hasValidMagicBytes(bytes, file.type)) {
      return Response.json(
        { error: `${label}: file contents do not match declared type` },
        { status: 400 },
      )
    }

    const photoId = randomUUID()

    if (devMode) {
      // Development fallback: echo as data URL so the UI can be tested locally.
      const b64 = Buffer.from(buffer).toString('base64')
      uploads.push({
        id: photoId,
        url: `data:${file.type};base64,${b64}`,
        size: file.size,
      })
      continue
    }

    const pathname = `session/${sessionId}/photo-${i}-${photoId}.${ext(file.type)}`
    const blob = await put(pathname, new Blob([buffer], { type: file.type }), {
      access: 'public',
      addRandomSuffix: false,
    })

    uploads.push({ id: photoId, url: blob.url, size: file.size })
  }

  return Response.json({ uploads } satisfies UploadResponse)
}
