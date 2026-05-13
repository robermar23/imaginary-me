'use client'

/**
 * @fileoverview StatusMessage — animated status text displayed while images
 * are being generated. Cycles through thematic copy when no specific title
 * is available.
 */

import { useEffect, useState } from 'react'

const AMBIENT_MESSAGES = [
  'Weaving your worlds…',
  'Consulting the oracles…',
  'Bending reality to your taste…',
  'Summoning alternate selves…',
  'Crafting your destiny…',
  'Painting dimensions…',
  'Unlocking possibilities…',
  'Forging your legend…',
]

interface Props {
  /** Specific title for the concept currently being generated, if known. */
  currentTitle: string | null
  completedCount: number
  totalCount: number
}

/**
 * Shows concept-specific copy when generating, or cycling ambient copy otherwise.
 * @param props.currentTitle - Current concept title.
 * @param props.completedCount - Images finished so far.
 * @param props.totalCount - Total images requested.
 * @returns StatusMessage element.
 */
export function StatusMessage({ currentTitle, completedCount, totalCount }: Props) {
  const [ambientIndex, setAmbientIndex] = useState(0)

  useEffect(() => {
    if (currentTitle) return
    const id = setInterval(() => {
      setAmbientIndex((i) => (i + 1) % AMBIENT_MESSAGES.length)
    }, 2800)
    return () => clearInterval(id)
  }, [currentTitle])

  const message = currentTitle
    ? `Placing you in ${currentTitle}…`
    : AMBIENT_MESSAGES[ambientIndex]

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-sm font-medium text-foreground transition-all duration-500">{message}</p>
      {totalCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {completedCount} of {totalCount} image{totalCount !== 1 ? 's' : ''} ready
        </p>
      )}
    </div>
  )
}
