'use client'

/**
 * @fileoverview Card-style single-selection component.
 * Used for art style and time period choices.
 */

import { cn } from '@/lib/utils'

export interface SelectOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly description?: string
  /** Emoji or short icon text shown on the card. */
  readonly icon?: string
  /** Tailwind gradient classes for the card background. */
  readonly gradient?: string
}

interface Props<T extends string> {
  readonly label?: string
  readonly options: readonly SelectOption<T>[]
  readonly value: T | ''
  readonly onChange: (value: T) => void
}

/**
 * Renders a grid of selectable cards with single-choice semantics.
 * @param props - label, options, value, onChange
 * @returns SingleSelect element.
 */
export function SingleSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border transition-all duration-150 text-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-card/80',
              )}
            >
              {opt.icon && (
                <span className="text-2xl leading-none">{opt.icon}</span>
              )}
              {opt.gradient && !opt.icon && (
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${opt.gradient}`}
                />
              )}
              <span
                className={cn(
                  'text-xs font-medium leading-tight',
                  isSelected ? 'text-primary' : 'text-foreground',
                )}
              >
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-[10px] text-muted-foreground leading-snug">
                  {opt.description}
                </span>
              )}
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
