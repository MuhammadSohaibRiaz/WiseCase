import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analyze Case Documents — Smart Lawyer Booking System",
  description:
    "Upload legal documents for AI-driven OCR/NLP to extract legal terms, summarize content, and support lawyer recommendations.",
}

export default function AnalyzePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 grid gap-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-balance">Analyze Your Case Documents</h1>
      <p className="text-muted-foreground">
        Upload legal documents (PDF/JPG/PNG) to extract key terms and summaries via OCR and NLP as described in the
        proposal. This is a prototype UI without backend processing.
      </p>
      <form className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Case description (optional)</span>
          <textarea
            className="min-h-28 rounded-md border px-3 py-2 text-sm"
            placeholder="Describe your case briefly..."
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Upload documents</span>
          <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="rounded-md border px-3 py-2 text-sm" />
          <span className="text-xs text-muted-foreground">
            Supported: PDF, JPG, PNG. English only (per proposal scope).
          </span>
        </label>
        <div className="flex gap-3">
          <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
            Analyze Documents
          </button>
          <a
            href="/match"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Continue to Best Match
          </a>
        </div>
      </form>
    </main>
  )
}
