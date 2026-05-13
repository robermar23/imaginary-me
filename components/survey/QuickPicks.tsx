'use client'

/**
 * @fileoverview Pre-populated clickable suggestion chips for quick tag selection.
 */

import { cn } from '@/lib/utils'

interface Props {
  /** All available quick-pick labels. */
  readonly suggestions: readonly string[]
  /** Currently selected tags (to dim already-selected ones). */
  readonly selected: readonly string[]
  /** Called when a chip is clicked. */
  readonly onSelect: (value: string) => void
  /** Maximum number of tags allowed (disables unselected chips when full). */
  readonly max?: number
}

/**
 * Renders a horizontal list of clickable suggestion chips.
 * @param props - suggestions, selected, onSelect, max
 * @returns QuickPicks element.
 */
export function QuickPicks({ suggestions, selected, onSelect, max = 5 }: Props) {
  const isAtMax = selected.length >= max

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick picks">
      {suggestions.map((s) => {
        const isSelected = selected.includes(s)
        const disabled = !isSelected && isAtMax

        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(s)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'bg-primary/20 border-primary text-primary font-medium'
                : disabled
                  ? 'border-border text-muted-foreground/30 cursor-not-allowed'
                  : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground cursor-pointer',
            )}
            aria-pressed={isSelected}
          >
            {s}
          </button>
        )
      })}
    </div>
  )
}
