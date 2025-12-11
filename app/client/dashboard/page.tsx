"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, FileText, DollarSign, MessageSquare, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  activeConsultations: number
  pendingPayments: number
  totalSpent: number
  nextAppointment: {
    date: string
    time: string
    lawyerName: string
  } | null
}

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeConsultations: 0,
    pendingPayments: 0,
    totalSpent: 0,
    nextAppointment: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const supabase = createClient()

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user?.id) {
          setError("Authentication required")
          console.error("[Client Dashboard] No active session")
          toast({
            title: "Authentication Required",
            description: "Please log in to view your dashboard",
            variant: "destructive",
          })
          return
        }

        console.log("[Client Dashboard] Fetching data for user:", session.user.id)

        // Fetch active consultations (cases that are open or in_progress)
        const { data: casesData } = await supabase
          .from("cases")
          .select("id, status")
          .eq("client_id", session.user.id)
          .in("status", ["open", "in_progress"])

        const activeConsultations = casesData?.length || 0

        // Fetch pending payments
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("amount, status")
          .eq("client_id", session.user.id)
          .eq("status", "pending")

        const pendingPayments = (paymentsData || []).reduce((sum, p) => sum + p.amount, 0)

        // Fetch total spent (completed payments)
        const { data: completedPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("client_id", session.user.id)
          .eq("status", "completed")

        const totalSpent = (completedPayments || []).reduce((sum, p) => sum + p.amount, 0)

        // Fetch next appointment
        const { data: appointmentsData } = await supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            status,
            lawyer:profiles!appointments_lawyer_id_fkey (
              first_name,
              last_name
            )
          `)
          .eq("client_id", session.user.id)
          .in("status", ["scheduled", "confirmed"])
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .single()

        let nextAppointment = null
        if (appointmentsData) {
          const appointmentDate = new Date(appointmentsData.scheduled_at)
          const dayOfWeek = appointmentDate.toLocaleDateString("en-US", { weekday: "long" })
          const time = appointmentDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          const lawyerName = `${appointmentsData.lawyer.first_name || ""} ${appointmentsData.lawyer.last_name || ""}`.trim()

          nextAppointment = {
            date: dayOfWeek,
            time: time,
            lawyerName: lawyerName || "Lawyer",
          }
        }

        setStats({
          activeConsultations,
          pendingPayments,
          totalSpent,
          nextAppointment,
        })
      } catch (error: any) {
        console.error("[Client Dashboard] Error fetching data:", error)
        setError(error.message || "Failed to load dashboard data")
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="space-y-8">
      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/client/cases">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Consultations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeConsultations}</div>
              <p className="text-xs text-muted-foreground">Ongoing cases</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/client/payments">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {stats.pendingPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Due now</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/client/appointments">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats.nextAppointment ? (
                <>
                  <div className="text-2xl font-bold">{stats.nextAppointment.date}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.nextAppointment.time} with {stats.nextAppointment.lawyerName}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">None</div>
                  <p className="text-xs text-muted-foreground">No upcoming appointments</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/client/payments">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {stats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/client/analysis">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer min-h-[180px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">Get AI analysis of your legal documents</p>
              <Button variant="outline" size="sm" className="mt-auto">
                Upload Now
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/match">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer min-h-[180px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Find a Lawyer
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">Browse verified lawyers in your area</p>
              <Button variant="outline" size="sm" className="mt-auto">
                Browse Now
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/client/ai-recommendations">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer min-h-[180px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">View AI-matched lawyers for your case</p>
              <Button variant="outline" size="sm">
                View Now
              </Button>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Recommended Lawyers */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Recommended Lawyers</h2>
          <p className="text-muted-foreground">Based on your case analysis</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Ahmed Hassan",
              specialization: "Corporate Law",
              rating: 4.9,
              location: "Karachi",
              match: "95%",
            },
            {
              name: "Fatima Khan",
              specialization: "Family Law",
              rating: 4.8,
              location: "Lahore",
              match: "88%",
            },
            {
              name: "Ali Raza",
              specialization: "Property Law",
              rating: 4.7,
              location: "Islamabad",
              match: "82%",
            },
          ].map((lawyer, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{lawyer.name}</CardTitle>
                    <CardDescription>{lawyer.specialization}</CardDescription>
                  </div>
                  <Badge variant="secondary">{lawyer.match}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{lawyer.location}</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {lawyer.rating}
                  </span>
                </div>
                <Button className="w-full">Book Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Notifications */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Recent Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              title: "Appointment Confirmed",
              message: "Your appointment with Ahmed Hassan is confirmed for Friday, 4 PM.",
              time: "2 hours ago",
            },
            {
              title: "Document Analyzed",
              message: "Your contract document has been analyzed. View the AI summary.",
              time: "1 day ago",
            },
            {
              title: "Payment Received",
              message: "Payment of PKR 10,000 has been received by your lawyer.",
              time: "3 days ago",
            },
          ].map((notif, idx) => (
            <Card key={idx} className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{notif.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{notif.time}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
