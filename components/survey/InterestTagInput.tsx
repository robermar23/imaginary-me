'use client'

/**
 * @fileoverview Autocomplete tag input with removable chips.
 * Supports keyboard: Enter/comma/tab to add, Backspace to remove last tag.
 */

import { useState, useRef, useCallback, useId } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickPicks } from '@/components/survey/QuickPicks'

interface Props {
  /** Display label for the field. */
  readonly label: string
  /** Subtext shown below the label. */
  readonly hint?: string
  /** Current selected tags. */
  readonly value: readonly string[]
  /** Called when tags change. */
  readonly onChange: (tags: string[]) => void
  /** Full autocomplete suggestion list. */
  readonly suggestions: readonly string[]
  /** Quick-pick chips shown below the input. */
  readonly quickPicks?: readonly string[]
  /** Max number of tags. */
  readonly max?: number
  /** Placeholder text for the input. */
  readonly placeholder?: string
}

/**
 * Controlled tag input with debounced autocomplete dropdown.
 * @param props - label, hint, value, onChange, suggestions, quickPicks, max, placeholder
 * @returns InterestTagInput element.
 */
export function InterestTagInput({
  label,
  hint,
  value,
  onChange,
  suggestions,
  quickPicks,
  max = 5,
  placeholder = 'Type and press Enter…',
}: Props) {
  const id = useId()
  const [inputValue, setInputValue] = useState('')
  const [filtered, setFiltered] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim()
      if (!trimmed || value.includes(trimmed) || value.length >= max) return
      onChange([...value, trimmed])
      setInputValue('')
      setFiltered([])
      setShowDropdown(false)
      setActiveIdx(-1)
    },
    [value, onChange, max],
  )

  const removeTag = useCallback(
    (tag: string) => onChange(value.filter((t) => t !== tag)),
    [value, onChange],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInputValue(v)
    setActiveIdx(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!v.trim()) {
      setFiltered([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      const lower = v.toLowerCase()
      const matches = suggestions
        .filter(
          (s) =>
            s.toLowerCase().includes(lower) && !value.includes(s),
        )
        .slice(0, 6)
      setFiltered(matches)
      setShowDropdown(matches.length > 0)
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (activeIdx >= 0 && filtered[activeIdx]) {
        addTag(filtered[activeIdx])
      } else {
        addTag(inputValue)
      }
      return
    }

    if (e.key === 'Tab' && showDropdown && filtered.length > 0) {
      e.preventDefault()
      addTag(filtered[activeIdx >= 0 ? activeIdx : 0])
      return
    }

    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
      return
    }

    if (e.key === 'Escape') {
      setShowDropdown(false)
      setActiveIdx(-1)
    }
  }

  const isAtMax = value.length >= max

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <span
          className={cn(
            'text-xs',
            isAtMax ? 'text-accent-violet font-medium' : 'text-muted-foreground',
          )}
        >
          {value.length}/{max}
        </span>
      </div>

      {hint && (
        <p className="text-xs text-muted-foreground -mt-1">{hint}</p>
      )}

      {/* Tags + input */}
      <div
        className={cn(
          'relative flex flex-wrap gap-1.5 p-2.5 rounded-lg border bg-muted/30',
          'transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-ring/50',
          'border-border min-h-[44px]',
        )}
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        {/* Tag chips */}
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded-full px-2.5 py-1 font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="hover:text-destructive transition-colors focus-visible:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Text input */}
        {!isAtMax && (
          <input
            id={id}
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls={`${id}-dropdown`}
            aria-activedescendant={
              activeIdx >= 0 ? `${id}-option-${activeIdx}` : undefined
            }
          />
        )}

        {/* Autocomplete dropdown */}
        {showDropdown && (
          <ul
            id={`${id}-dropdown`}
            role="listbox"
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {filtered.map((item, i) => (
              <li
                key={item}
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); addTag(item) }}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer transition-colors',
                  i === activeIdx
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-accent text-foreground',
                )}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick picks */}
      {quickPicks && quickPicks.length > 0 && (
        <div className="mt-1">
          <p className="text-xs text-muted-foreground mb-1.5">Popular picks:</p>
          <QuickPicks
            suggestions={quickPicks}
            selected={value}
            onSelect={addTag}
            max={max}
          />
        </div>
      )}
    </div>
  )
}
