/**
 * @fileoverview Static guidance tips for the photo upload step.
 */

import { Lightbulb } from 'lucide-react'

/**
 * Renders brief tips to help users pick effective reference photos.
 * @returns Tips element.
 */
export function UploadTips() {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface border border-border">
      <Lightbulb className="w-4 h-4 text-accent-violet shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-muted-foreground leading-relaxed">
        For the best results, use clear front-facing photos with good lighting. The AI
        uses your facial features as a reference to place you in each world.
      </p>
    </div>
  )
}
