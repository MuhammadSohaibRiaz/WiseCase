
import type React from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "WiseCase — Smart Lawyer Booking System",
    template: "%s | WiseCase",
  },
  description:
    "AI-driven web-based platform to search lawyers, book appointments, analyze case documents with OCR/NLP, and pay securely.",
  keywords: [
    "Lawyer Booking",
    "AI recommendation",
    "OCR",
    "NLP",
    "Legal document analysis",
    "Stripe payments",
    "legal consultation",
    "lawyer search",
    "case management",
  ],
  authors: [{ name: "WiseCase" }],
  creator: "WiseCase",
  publisher: "WiseCase",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "WiseCase — Smart Lawyer Booking System",
    description: "AI-driven web-based platform to search lawyers, book appointments, analyze case documents with OCR/NLP, and pay securely.",
    siteName: "WiseCase",
  },
  twitter: {
    card: "summary_large_image",
    title: "WiseCase — Smart Lawyer Booking System",
    description: "AI-driven web-based platform to search lawyers, book appointments, analyze case documents with OCR/NLP, and pay securely.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}



