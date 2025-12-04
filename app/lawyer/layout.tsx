"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LawyerSidebar } from "@/components/lawyer/sidebar"
import { createClient } from "@/lib/supabase/client"

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
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
        router.push("/auth/lawyer/sign-in")
        return
      }

      // Check user_type
      const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

      if (profile?.user_type !== "lawyer") {
        router.push(profile?.user_type === "client" ? "/client/dashboard" : "/auth/lawyer/sign-in")
        return
      }

      const handleResize = () => {
        if (window.innerWidth >= 768) {
          setSidebarOpen(true)
        } else {
          setSidebarOpen(false)
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
    <div className="min-h-screen bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 md:hidden bg-background border shadow-sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full bg-background border-r z-40 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 overflow-y-auto`}
      >
        <div className="p-4 pt-16">
          <LawyerSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </aside>

      <main className="w-full">{children}</main>
    </div>
  )
}
