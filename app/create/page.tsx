import { Suspense } from 'react'
import { Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { CreateFlow } from '@/components/CreateFlow'

/**
 * Create page — full survey + upload + generation flow.
 * Server Component shell; interactive routing lives in CreateFlow (Client Component).
 * CreateFlow uses useSearchParams so must be inside Suspense.
 */
export default function CreatePage() {
  return (
    <AppShell>
      <Suspense fallback={<CreatePageSkeleton />}>
        <CreateFlow />
      </Suspense>
    </AppShell>
  )
}

function CreatePageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
      <Sparkles className="w-6 h-6 animate-pulse text-accent-violet" />
      <p className="text-sm">Loading your experience…</p>
    </div>
  )
}
