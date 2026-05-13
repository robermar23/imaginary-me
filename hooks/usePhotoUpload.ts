'use client'

/**
 * @fileoverview Hook for the photo upload flow.
 * Handles client-side resize, EXIF stripping via canvas, API upload, and store sync.
 */

import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useSessionStore } from '@/store/session'
import type { UploadedPhoto, UploadResponse } from '@/types'

const MAX_PHOTOS = 3
const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024 // 10 MB (original file pre-resize)
const CANVAS_MAX_SIDE = 1024
const JPEG_QUALITY = 0.85
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/**
 * Resizes an image to fit within CANVAS_MAX_SIDE × CANVAS_MAX_SIDE, converting
 * it to JPEG. Drawing through canvas strips all EXIF metadata as a side effect.
 * @param file - Original image file from the user.
 * @returns Resized JPEG blob and a base64 preview data URL.
 */
async function resizeAndStripExif(
  file: File,
): Promise<{ blob: Blob; previewUrl: string }> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, CANVAS_MAX_SIDE / Math.max(width, height))
  const newW = Math.round(width * scale)
  const newH = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = newW
  canvas.height = newH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, newW, newH)
  bitmap.close()

  const previewUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })

  return { blob, previewUrl }
}

export interface UsePhotoUploadReturn {
  readonly uploading: boolean
  readonly handleFiles: (files: File[]) => Promise<void>
  readonly removePhoto: (id: string) => void
  readonly photos: readonly UploadedPhoto[]
  readonly canAddMore: boolean
}

/**
 * Manages the photo upload lifecycle: validate → resize → upload → store.
 * @returns Upload state and action callbacks.
 */
export function usePhotoUpload(): UsePhotoUploadReturn {
  const sessionId = useSessionStore((s) => s.sessionId)
  const photos = useSessionStore((s) => s.uploadedPhotos)
  const addPhoto = useSessionStore((s) => s.addPhoto)
  const removePhoto = useSessionStore((s) => s.removePhoto)

  const [uploading, setUploading] = useState(false)

  const canAddMore = photos.length < MAX_PHOTOS

  const handleFiles = useCallback(
    async (files: File[]) => {
      const remaining = MAX_PHOTOS - photos.length
      if (remaining <= 0) return

      const toProcess = files.slice(0, remaining)
      if (files.length > remaining) {
        toast(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} allowed — extras were ignored`)
      }

      // Client-side validation before upload
      for (const file of toProcess) {
        if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
          toast.error(`"${file.name}" must be JPG, PNG, or WebP`)
          return
        }
        if (file.size > MAX_ORIGINAL_SIZE) {
          toast.error(`"${file.name}" exceeds 10 MB`)
          return
        }
      }

      setUploading(true)

      try {
        for (const file of toProcess) {
          const { blob, previewUrl } = await resizeAndStripExif(file)

          const form = new FormData()
          form.append('sessionId', sessionId)
          form.append('photos', blob, 'photo.jpg')

          const res = await fetch('/api/upload', { method: 'POST', body: form })

          if (!res.ok) {
            const data = (await res.json()) as { error?: string }
            throw new Error(data.error ?? 'Upload failed')
          }

          const { uploads } = (await res.json()) as UploadResponse
          const upload = uploads[0]

          const photo: UploadedPhoto = {
            id: upload.id,
            url: upload.url,
            previewUrl,
            size: upload.size,
          }

          addPhoto(photo)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [sessionId, photos.length, addPhoto],
  )

  return { uploading, handleFiles, removePhoto, photos, canAddMore }
}
