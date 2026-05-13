'use client'

/**
 * @fileoverview Card-style multi-selection component with an optional max limit.
 * Used for mood selection (max 2).
 */

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface MultiSelectOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly description?: string
  /** Emoji or short icon text. */
  readonly icon?: string
  /** Tailwind gradient classes applied as card overlay. */
  readonly gradient?: string
}

interface Props<T extends string> {
  readonly label?: string
  readonly hint?: string
  readonly options: readonly MultiSelectOption<T>[]
  readonly value: readonly T[]
  readonly onChange: (value: T[]) => void
  readonly max?: number
}

/**
 * Renders a grid of toggleable cards for multi-choice selection.
 * @param props - label, hint, options, value, onChange, max
 * @returns MultiSelect element.
 */
export function MultiSelect<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  max = Infinity,
}: Props<T>) {
  function toggle(opt: T) {
    const idx = value.indexOf(opt)
    if (idx >= 0) {
      onChange(value.filter((v) => v !== opt) as T[])
    } else if (value.length < max) {
      onChange([...value, opt] as T[])
    }
  }

  const isAtMax = value.length >= max

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {max < Infinity && (
            <span className="text-xs text-muted-foreground">
              Pick up to {max}
            </span>
          )}
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
        role="group"
        aria-label={label}
      >
        {options.map((opt) => {
          const isSelected = value.includes(opt.value)
          const disabled = !isSelected && isAtMax

          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => toggle(opt.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border transition-all duration-150 text-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                  : disabled
                    ? 'border-border bg-card opacity-40 cursor-not-allowed'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-card/80 cursor-pointer',
              )}
            >
              {/* Gradient swatch */}
              {opt.gradient && (
                <div
                  className={`w-10 h-6 rounded-md bg-gradient-to-r ${opt.gradient}`}
                />
              )}
              {opt.icon && (
                <span className="text-2xl leading-none">{opt.icon}</span>
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
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
