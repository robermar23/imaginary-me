import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

/**
 * 404 page — shown when a route is not matched.
 * @returns Not-found UI element.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-accent-violet" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          This world doesn&apos;t exist yet
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          The page you&apos;re looking for has drifted into another dimension.
        </p>
      </div>

      <Link href="/" className={buttonVariants()}>
        Return home
      </Link>
    </div>
  )
}
