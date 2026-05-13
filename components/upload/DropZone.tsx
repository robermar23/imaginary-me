'use client'

/**
 * @fileoverview Drag-and-drop / tap-to-pick photo upload zone.
 * Delegates file validation to react-dropzone (type + size constraints),
 * shows appropriate visual states, and calls onFiles with accepted files.
 */

import { useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Camera, Loader2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

interface Props {
  /** Called with each batch of accepted files. */
  readonly onFiles: (files: File[]) => Promise<void>
  /** Whether an upload is currently in progress. */
  readonly uploading: boolean
  /** Disables interaction (at max photos or uploading). */
  readonly disabled: boolean
  /** Remaining photo slots — shown in the hint text. */
  readonly remaining: number
}

/**
 * Upload drop zone with drag-over, active, and disabled visual states.
 * @param props - Component props.
 * @returns Drop zone element.
 */
export function DropZone({ onFiles, uploading, disabled, remaining }: Props) {
  const handleRejected = useCallback((rejections: FileRejection[]) => {
    const seen = new Set<string>()
    for (const { errors } of rejections) {
      for (const { code } of errors) {
        if (seen.has(code)) continue
        seen.add(code)
        if (code === 'file-too-large') toast.error('File exceeds 10 MB limit')
        else if (code === 'file-invalid-type') toast.error('Use JPG, PNG, or WebP')
        else toast.error('File could not be accepted')
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxSize: MAX_SIZE,
    multiple: remaining > 1,
    disabled: disabled || remaining <= 0,
    onDrop: onFiles,
    onDropRejected: handleRejected,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed',
        'min-h-48 transition-colors select-none',
        !disabled && 'cursor-pointer',
        isDragActive
          ? 'border-accent-violet bg-accent-violet/10'
          : 'border-border bg-surface hover:border-accent-violet/40 hover:bg-surface/80',
        disabled && !uploading && 'opacity-50 cursor-not-allowed pointer-events-none',
      )}
      aria-label="Photo upload area"
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <Loader2 className="w-8 h-8 text-accent-violet animate-spin" />
          <p className="text-sm font-medium text-foreground">Uploading…</p>
        </div>
      ) : isDragActive ? (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <Upload className="w-8 h-8 text-accent-violet" />
          <p className="text-sm font-medium text-accent-violet">Drop photos here</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <Camera className="w-8 h-8 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              Tap to upload or drag photos here
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP — up to 10 MB each
              {remaining < 3 && (
                <> &middot; {remaining} slot{remaining === 1 ? '' : 's'} remaining</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
