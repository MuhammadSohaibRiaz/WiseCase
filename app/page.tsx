import type { Metadata } from "next"
import { Hero } from "@/components/sections/hero"
import { Features } from "@/components/sections/features"
import { ImageCarousel } from "@/components/sections/carousel"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Smart Lawyer Booking System — AI-driven search, booking, and document analysis",
  description:
    "AI-based web platform to search lawyers by specialization/area, book appointments with availability, analyze legal documents via OCR/NLP, and pay securely.",
}

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Smart Lawyer Booking System",
    url: "https://example.com",
    description: "AI-driven lawyer search and booking with OCR/NLP document analysis and secure payments.",
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <Hero />
      <ImageCarousel />
      <section id="how-it-works" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 grid gap-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-balance">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            <li className="rounded-lg border p-4">
              <h3 className="font-medium">1) Search & Filter</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Find attorneys by specialization, area, and reviews with advanced filters.
              </p>
            </li>
            <li className="rounded-lg border p-4">
              <h3 className="font-medium">2) Upload & Analyze</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload legal documents for AI‑driven text extraction, summaries, risk analysis, and legal term
                extraction.
              </p>
            </li>
            <li className="rounded-lg border p-4">
              <h3 className="font-medium">3) Book & Pay</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Book appointments with availability tracking and pay securely (e.g., Stripe).
              </p>
            </li>
          </ol>
        </div>
      </section>
      <Features />
      <section id="get-started" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 grid gap-6">
          <h2 className="text-2xl md:text-3xl font-semibold">Ready to get started?</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="/auth/client/register"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              Register Now
            </a>
            <a
              href="/client/analysis"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Get Your Case Document Analyzed
            </a>
            <a
              href="/match"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Get Best Match for Your Case
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            By proceeding you agree to our{" "}
            <a href="/terms" className="underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </>
  )
}
