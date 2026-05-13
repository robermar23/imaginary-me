'use client'

/**
 * @fileoverview Dot progress indicator for the survey wizard.
 * Shows step position with filled/outline dots.
 */

import { cn } from '@/lib/utils'

interface Props {
  /** Total number of steps. */
  readonly total: number
  /** Current step index (0-based). */
  readonly current: number
  /** Optional label shown next to the dots. */
  readonly label?: string
}

/**
 * Renders a row of dots indicating wizard progress.
 * @param props - total, current, label
 * @returns Progress indicator element.
 */
export function StepProgress({ total, current, label }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total} aria-label={`Step ${current + 1} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'block rounded-full transition-all duration-300',
              i === current
                ? 'w-5 h-2 bg-accent-violet'
                : i < current
                  ? 'w-2 h-2 bg-accent-violet/60'
                  : 'w-2 h-2 bg-border',
            )}
          />
        ))}
      </div>
      {label && (
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
      )}
    </div>
  )
}
