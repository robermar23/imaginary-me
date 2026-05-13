import { HeroSection } from '@/components/landing/HeroSection'

/**
 * Landing page — hero section with CTA.
 * Server Component; HeroSection is a Client Component for interactivity.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background">
      <HeroSection />
    </div>
  )
}
