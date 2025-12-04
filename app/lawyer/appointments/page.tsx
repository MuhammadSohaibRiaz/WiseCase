"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Calendar, Clock, FileText, User, Check, X } from "lucide-react"
import { LawyerDashboardHeader } from "@/components/lawyer/dashboard-header"
import { LawyerSidebar } from "@/components/lawyer/sidebar"
import { notifyAppointmentUpdate } from "@/lib/notifications"

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: "pending" | "scheduled" | "completed" | "cancelled" | "rescheduled" | "rejected"
  request_message?: string
  notes?: string
  case: {
    id: string
    title: string
    case_type: string
    description?: string
  }
  client: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    email: string
  }
}

export default function LawyerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [lawyerId, setLawyerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session?.user?.id) {
          setError("Not authenticated")
          return
        }

        setLawyerId(sessionData.session.user.id)

        const { data, error: fetchError } = await supabase
          .from("appointments")
          .select(
            `
            id,
            scheduled_at,
            duration_minutes,
            status,
            request_message,
            notes,
            cases (
              id,
              title,
              case_type,
              description
            ),
            profiles!appointments_client_id_fkey (
              id,
              first_name,
              last_name,
              avatar_url,
              email
            )
          `,
          )
          .eq("lawyer_id", sessionData.session.user.id)
          .order("created_at", { ascending: false })

        if (fetchError) throw fetchError

        setAppointments(
          (data || []).map((apt: any) => ({
            id: apt.id,
            scheduled_at: apt.scheduled_at,
            duration_minutes: apt.duration_minutes,
            status: apt.status,
            request_message: apt.request_message,
            notes: apt.notes,
            case: apt.cases || {},
            client: apt.profiles || {},
          })),
        )
      } catch (error) {
        console.error("[v0] Fetch error:", error)
        setError("Failed to load appointments")
        toast({
          title: "Error",
          description: "Failed to load your appointments.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()

    // Set up real-time subscription
    const setupRealtime = async () => {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session?.user?.id) return null

      const channel = supabase
        .channel(`appointments-changes-${sessionData.session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments",
            filter: `lawyer_id=eq.${sessionData.session.user.id}`,
          },
          (payload) => {
            console.log("[v0] Real-time update:", payload)
            fetchAppointments()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    let cleanup: (() => void) | null = null
    setupRealtime().then((fn) => {
      cleanup = fn
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [toast])

  const handleAcceptRequest = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId)
      const supabase = createClient()
      const targetAppointment = appointments.find((apt) => apt.id === appointmentId)

      if (!targetAppointment || !lawyerId) {
        throw new Error("Appointment not found")
      }

      const { data: scheduledAppointments, error: scheduleError } = await supabase
        .from("appointments")
        .select("id, scheduled_at, duration_minutes")
        .eq("lawyer_id", lawyerId)
        .in("status", ["scheduled"])
        .neq("id", appointmentId)

      if (scheduleError) throw scheduleError

      const slotStart = new Date(targetAppointment.scheduled_at)
      const slotEnd = new Date(slotStart.getTime() + targetAppointment.duration_minutes * 60000)
      const hasConflict = (scheduledAppointments || []).some((apt) => {
        const aptStart = new Date(apt.scheduled_at)
        const aptEnd = new Date(aptStart.getTime() + apt.duration_minutes * 60000)
        return !(slotEnd <= aptStart || slotStart >= aptEnd)
      })

      if (hasConflict) {
        toast({
          title: "Schedule conflict",
          description: "You already have a confirmed appointment in this slot. Please coordinate a new time.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("appointments")
        .update({
          status: "scheduled",
          responded_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)

      if (error) throw error

      // Update local state
      setAppointments(
        appointments.map((apt) => (apt.id === appointmentId ? { ...apt, status: "scheduled" } : apt)),
      )

      await notifyAppointmentUpdate(
        "lawyer_accept",
        {
          recipientId: targetAppointment.client.id,
          actorId: lawyerId,
          caseTitle: targetAppointment.case.title,
          scheduledAt: targetAppointment.scheduled_at,
          appointmentId,
          caseId: targetAppointment.case.id,
        },
        supabase,
      )

      toast({
        title: "Success",
        description: "Appointment request accepted. The client has been notified.",
      })
    } catch (error) {
      console.error("[v0] Accept error:", error)
      toast({
        title: "Error",
        description: "Failed to accept appointment request.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectRequest = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId)
      const supabase = createClient()
      const targetAppointment = appointments.find((apt) => apt.id === appointmentId)

      if (!targetAppointment || !lawyerId) {
        throw new Error("Appointment not found")
      }

      const { error } = await supabase
        .from("appointments")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)

      if (error) throw error

      // Update local state
      setAppointments(
        appointments.map((apt) => (apt.id === appointmentId ? { ...apt, status: "rejected" } : apt)),
      )

      await notifyAppointmentUpdate(
        "lawyer_reject",
        {
          recipientId: targetAppointment.client.id,
          actorId: lawyerId,
          caseTitle: targetAppointment.case.title,
          appointmentId,
          caseId: targetAppointment.case.id,
        },
        supabase,
      )

      toast({
        title: "Request Rejected",
        description: "The appointment request has been rejected.",
      })
    } catch (error) {
      console.error("[v0] Reject error:", error)
      toast({
        title: "Error",
        description: "Failed to reject appointment request.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const pendingAppointments = appointments.filter((apt) => apt.status === "pending")
  const otherAppointments = appointments.filter((apt) => apt.status !== "pending")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LawyerDashboardHeader />
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <LawyerDashboardHeader />
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <h2 className="font-semibold text-red-900">Error</h2>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <LawyerDashboardHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="hidden md:block md:col-span-1">
            <div className="sticky top-4">
              <LawyerSidebar />
            </div>
          </aside>

          <main className="md:col-span-3 space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Appointment Requests</h1>
              <p className="mt-2 text-muted-foreground">Review and manage client appointment requests</p>
            </div>

            {/* Pending Requests */}
            {pendingAppointments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Pending Requests</h2>
                  <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">
                    {pendingAppointments.length} New
                  </Badge>
                </div>

                {pendingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          {appointment.client.avatar_url ? (
                            <img
                              src={appointment.client.avatar_url}
                              alt={`${appointment.client.first_name} ${appointment.client.last_name}`}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-lg">
                              {appointment.client.first_name} {appointment.client.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{appointment.client.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="text-sm font-medium">
                                {new Date(appointment.scheduled_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Time</p>
                              <p className="text-sm font-medium">
                                {new Date(appointment.scheduled_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                ({appointment.duration_minutes}m)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Case Type</p>
                              <p className="text-sm font-medium">{appointment.case.case_type || "Consultation"}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Case Title</p>
                          <p className="text-sm font-medium">{appointment.case.title || "N/A"}</p>
                        </div>

                        {appointment.request_message && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Client Message</p>
                            <p className="text-sm bg-background rounded p-3 border border-border">
                              {appointment.request_message}
                            </p>
                          </div>
                        )}

                        {appointment.case.description && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Case Description</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{appointment.case.description}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent text-destructive border-destructive hover:bg-destructive hover:text-white"
                            onClick={() => handleRejectRequest(appointment.id)}
                            disabled={processingId === appointment.id}
                          >
                            {processingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAcceptRequest(appointment.id)}
                            disabled={processingId === appointment.id}
                          >
                            {processingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Other Appointments */}
            {otherAppointments.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">All Appointments</h2>

                {otherAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`rounded-lg border ${
                      appointment.status === "rejected"
                        ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50"
                        : appointment.status === "scheduled"
                          ? "border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800/50 shadow-sm"
                          : appointment.status === "completed"
                            ? "border-green-200 bg-green-50/30 dark:bg-green-950/20 dark:border-green-800/50"
                            : appointment.status === "cancelled"
                              ? "border-gray-200 bg-gray-50/30 dark:bg-gray-900/20 dark:border-gray-800/50 opacity-75"
                              : "border-border bg-card"
                    } p-6 transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          {appointment.client.avatar_url ? (
                            <img
                              src={appointment.client.avatar_url}
                              alt={`${appointment.client.first_name} ${appointment.client.last_name}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {appointment.client.first_name} {appointment.client.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{appointment.case.case_type || "Consultation"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="text-sm font-medium">
                                {new Date(appointment.scheduled_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Time</p>
                              <p className="text-sm font-medium">
                                {new Date(appointment.scheduled_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                ({appointment.duration_minutes}m)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Case</p>
                              <p className="text-sm font-medium">{appointment.case.title || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            appointment.status === "scheduled"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : appointment.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800"
                                : appointment.status === "rejected"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800"
                                  : appointment.status === "cancelled"
                                    ? "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300"
                          }`}
                        >
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {appointments.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <h3 className="mt-4 font-semibold">No appointments yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Appointment requests from clients will appear here</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

