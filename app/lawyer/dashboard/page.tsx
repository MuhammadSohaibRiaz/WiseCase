export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { LawyerDashboardHeader } from "@/components/lawyer/dashboard-header"
import { LawyerSidebar } from "@/components/lawyer/sidebar"
import { ActiveCases } from "@/components/lawyer/active-cases"
import { ClientRequests } from "@/components/lawyer/client-requests"
import { CaseStudies } from "@/components/lawyer/case-studies"
import { ClientTestimonials } from "@/components/lawyer/testimonials"
import { LawyerCertificates } from "@/components/lawyer/certificates"

export const metadata: Metadata = {
  title: "Lawyer Dashboard — Smart Lawyer Booking System",
  description: "Manage your cases, client requests, and professional profile.",
}

export default function LawyerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <LawyerDashboardHeader />

      <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="hidden md:block md:col-span-1">
            <div className="sticky top-4">
              <LawyerSidebar />
            </div>
          </aside>

          <main className="md:col-span-3 space-y-4 md:space-y-6">
            <ActiveCases />
            <ClientRequests />
            <LawyerCertificates />
            <CaseStudies />
            <ClientTestimonials />
          </main>
        </div>
      </div>
    </div>
  )
}
