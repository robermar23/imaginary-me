'use client'

/**
 * @fileoverview Photo upload step — drop zone, thumbnail strip, tips, and navigation.
 * Connects the UI to usePhotoUpload and routes forward/back via the URL step param.
 */

import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropZone } from '@/components/upload/DropZone'
import { PhotoThumbnail } from '@/components/upload/PhotoThumbnail'
import { UploadTips } from '@/components/upload/UploadTips'
import { usePhotoUpload } from '@/hooks/usePhotoUpload'

const MAX_PHOTOS = 3

/**
 * Full photo-upload step: drop zone, thumbnail strip, guidance, and navigation.
 * @returns PhotoUpload element.
 */
export function PhotoUpload() {
  const router = useRouter()
  const { uploading, handleFiles, removePhoto, photos, canAddMore } = usePhotoUpload()

  const hasPhotos = photos.length > 0
  const remaining = MAX_PHOTOS - photos.length

  function handleBack() {
    router.push('/create?step=survey-aesthetic')
  }

  function handleNext() {
    router.push('/create?step=generation-settings')
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Heading */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold text-foreground">Upload your photos</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ll place you in your worlds. Add up to {MAX_PHOTOS} photos.
        </p>
      </div>

      {/* Drop zone — hidden once all slots are filled */}
      {canAddMore && (
        <DropZone
          onFiles={handleFiles}
          uploading={uploading}
          disabled={uploading}
          remaining={remaining}
        />
      )}

      {/* Thumbnail strip */}
      {hasPhotos && (
        <div className="flex flex-wrap gap-3" role="list" aria-label="Uploaded photos">
          {photos.map((photo) => (
            <div key={photo.id} role="listitem">
              <PhotoThumbnail photo={photo} onRemove={() => removePhoto(photo.id)} />
            </div>
          ))}

          {/* Re-add slot when at limit */}
          {!canAddMore && (
            <button
              type="button"
              onClick={() => {
                // Removing the first photo frees a slot; guide is implicit via the DropZone reappearing
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/jpeg,image/png,image/webp'
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files?.length) void handleFiles(Array.from(files))
                }
                input.click()
              }}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-accent-violet/50 hover:text-accent-violet transition-colors text-xs text-center leading-tight px-1"
              aria-label="Replace a photo"
              disabled={uploading}
            >
              Remove one to add more
            </button>
          )}
        </div>
      )}

      {/* Guidance */}
      <UploadTips />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={uploading}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          {!hasPhotos && (
            <p className="text-xs text-muted-foreground">
              Add at least one photo to continue
            </p>
          )}
          <Button
            onClick={handleNext}
            disabled={!hasPhotos || uploading}
            className="gap-2 gradient-accent text-white border-0 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
