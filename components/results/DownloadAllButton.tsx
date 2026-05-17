'use client'

/**
 * @fileoverview DownloadAllButton — downloads all completed images as a ZIP.
 * JSZip is dynamically imported so it is not in the initial bundle.
 */

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import type { GeneratedImage } from '@/types'

interface Props {
  images: readonly GeneratedImage[]
}

/**
 * Fetches image bytes from a URL (supports data URLs and remote URLs).
 * @param url - Image URL.
 * @returns Blob of image bytes.
 */
async function fetchImageBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    const [header, b64] = url.split(',')
    const mime = header.split(':')[1].split(';')[0]
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    return new Blob([bytes], { type: mime })
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  return res.blob()
}

/**
 * Button that zips all completed images and triggers a download.
 * @param images - Array of completed GeneratedImage objects.
 * @returns DownloadAllButton element.
 */
export function DownloadAllButton({ images }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownloadAll() {
    if (loading || images.length === 0) return
    setLoading(true)

    try {
      // Dynamic import keeps JSZip out of the initial bundle
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      const fetchJobs = images.map(async (img, i) => {
        const blob = await fetchImageBlob(img.imageUrl)
        const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png'
        const name = img.title
          ? `${String(i + 1).padStart(2, '0')}-${img.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${ext}`
          : `${String(i + 1).padStart(2, '0')}-imaginary-me.${ext}`
        zip.file(name, blob)
      })

      await Promise.all(fetchJobs)

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'imaginary-me-images.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDownloadAll}
      disabled={loading || images.length === 0}
      className="w-full gap-2 gradient-accent text-white border-0 hover:opacity-90"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparing download…
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download All ({images.length})
        </>
      )}
    </Button>
  )
}
