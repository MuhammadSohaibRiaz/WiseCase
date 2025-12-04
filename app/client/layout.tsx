"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { ClientSidebar } from "@/components/client/sidebar"
import { ClientHeader } from "@/components/client/header"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth/client/sign-in")
        return
      }

      // Check user_type - only allow clients
      const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

      if (profile?.user_type !== "client") {
        router.push(profile?.user_type === "lawyer" ? "/lawyer/dashboard" : "/auth/client/sign-in")
        return
      }

      // Set initial state based on screen size
      const handleResize = () => {
        if (window.innerWidth >= 768) {
          setSidebarOpen(true)
        }
      }

      handleResize()
      window.addEventListener("resize", handleResize)
      setIsLoading(false)
      return () => window.removeEventListener("resize", handleResize)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ClientSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ClientHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
