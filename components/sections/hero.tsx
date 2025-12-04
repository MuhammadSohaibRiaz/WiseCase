import Link from "next/link"
import { CityOnlineSelect } from "@/components/sections/city-online-select"
import { Input } from "@/components/ui/input"

export function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid gap-8 md:gap-12">
        <div className="max-w-3xl">
          <h1 className="text-balance text-4xl md:text-5xl font-bold tracking-tight">
            AI‑Driven Lawyer Search, Booking, and Case Document Analysis — CaseWise
          </h1>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Find the most suitable lawyer by specialization and experience, book appointments with tracked availability,
            and analyze legal documents using OCR and NLP for summaries, key terms, and risk insights.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <CityOnlineSelect />
            <Input placeholder="Practice area (e.g., Family)" />
            <Link
              href="/match"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              Find Best Match
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              Get Your Case Document Analyzed
            </Link>
            <Link
              href="/match"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Find Best‑Matched Lawyer
            </Link>
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-lg border p-4">
            <h3 className="font-semibold">AI‑Powered Lawyer Suggestion</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Recommendations based on case information, document analysis, and lawyer specialization.
            </p>
          </li>
          <li className="rounded-lg border p-4">
            <h3 className="font-semibold">Automated Case Document Analysis</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload legal documents for OCR/NLP to extract legal terms, summarize content, and highlight risks.
            </p>
          </li>
          <li className="rounded-lg border p-4">
            <h3 className="font-semibold">Secure Payments</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Seamless and secure payment for consultations via a gateway such as Stripe.
            </p>
          </li>
        </ul>
      </div>
    </section>
  )
}
