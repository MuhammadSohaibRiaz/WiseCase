"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-provider"

export function SiteHeader() {
  const pathname = usePathname()

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (pathname !== "/") {
      // If not on home page, navigate to home with hash
      return // Let the default Link behavior handle it
    } else {
      // If on home page, smooth scroll to section
      e.preventDefault()
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight text-primary">
          Case Wise
        </Link>
        <nav aria-label="Primary" className="hidden md:flex items-center gap-3">
          <Link
            href="/#features"
            className="text-sm hover:underline"
            onClick={(e) => handleSectionClick(e, "features")}
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm hover:underline"
            onClick={(e) => handleSectionClick(e, "how-it-works")}
          >
            How it works
          </Link>
          <Link
            href="/match"
            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
          >
            Find best match
          </Link>
          <Link
            href="/client/analysis"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            Get your case analyzed
          </Link>
          <Link
            href="/auth/lawyer/sign-in"
            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
          >
            For Lawyers
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
