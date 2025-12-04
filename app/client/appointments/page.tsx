"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Calendar, Clock, FileText } from "lucide-react"
import { notifyAppointmentUpdate } from "@/lib/notifications"

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: "pending" | "scheduled" | "completed" | "cancelled" | "rescheduled" | "rejected"
  case: {
    title: string
    case_type: string
  }
  lawyer: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  }
}

export default function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
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
        setClientId(sessionData.session.user.id)

        const { data, error: fetchError } = await supabase
          .from("appointments")
          .select(
            `
            id,
            scheduled_at,
            duration_minutes,
            status,
            cases (
              title,
              case_type
            ),
            profiles!appointments_lawyer_id_fkey (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `,
          )
          .eq("client_id", sessionData.session.user.id)
          .order("scheduled_at", { ascending: false })

        if (fetchError) throw fetchError

        setAppointments(
          (data || []).map((apt: any) => ({
            id: apt.id,
            scheduled_at: apt.scheduled_at,
            duration_minutes: apt.duration_minutes,
            status: apt.status,
            case: apt.cases || {},
            lawyer: apt.profiles || {},
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
  }, [toast])

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId)

      if (error) throw error

      setAppointments(appointments.map((apt) => (apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt)))

      const targetAppointment = appointments.find((apt) => apt.id === appointmentId)
      if (clientId && targetAppointment?.lawyer?.id) {
        await notifyAppointmentUpdate(
          "client_cancel",
          {
            recipientId: targetAppointment.lawyer.id,
            actorId: clientId,
            caseTitle: targetAppointment.case.title,
            scheduledAt: targetAppointment.scheduled_at,
            appointmentId,
            caseId: targetAppointment.case.id,
          },
          supabase,
        )
      }

      toast({
        title: "Success",
        description: "Appointment cancelled successfully.",
      })
    } catch (error) {
      console.error("[v0] Cancel error:", error)
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-900">Error</h2>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Appointments</h1>
        <p className="mt-2 text-muted-foreground">Manage your upcoming consultations and scheduled meetings</p>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold">No appointments yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Browse lawyers and book your first consultation</p>
          <a href="/match" className="mt-4 inline-block">
            <Button>Find a Lawyer</Button>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`rounded-lg border ${
                appointment.status === "cancelled"
                  ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 opacity-75"
                  : appointment.status === "pending"
                    ? "border-orange-200 bg-orange-50/30 dark:bg-orange-950/20 dark:border-orange-800/50"
                    : appointment.status === "scheduled"
                      ? "border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800/50 shadow-sm"
                      : appointment.status === "completed"
                        ? "border-green-200 bg-green-50/30 dark:bg-green-950/20 dark:border-green-800/50"
                        : appointment.status === "rejected"
                          ? "border-red-200 bg-red-50/30 dark:bg-red-950/20 dark:border-red-800/50"
                          : "border-border bg-card"
              } p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    {appointment.lawyer.avatar_url ? (
                      <img
                        src={appointment.lawyer.avatar_url || "/placeholder.svg"}
                        alt={`${appointment.lawyer.first_name} ${appointment.lawyer.last_name}`}
                        className={`h-10 w-10 rounded-full object-cover ${
                          appointment.status === "cancelled" ? "opacity-50 grayscale" : ""
                        }`}
                      />
                    ) : (
                      <div
                        className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${
                          appointment.status === "cancelled" ? "opacity-50" : ""
                        }`}
                      >
                        <span className="text-sm font-medium text-muted-foreground">
                          {appointment.lawyer.first_name?.charAt(0)}
                          {appointment.lawyer.last_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p
                        className={`font-medium ${
                          appointment.status === "cancelled" ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {appointment.lawyer.first_name} {appointment.lawyer.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{appointment.case.case_type || "Consultation"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="text-sm font-medium">{new Date(appointment.scheduled_at).toLocaleDateString()}</p>
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
                      appointment.status === "pending"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                        : appointment.status === "scheduled"
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

                  {appointment.status === "scheduled" && (
                    <Button variant="destructive" size="sm" onClick={() => handleCancelAppointment(appointment.id)}>
                      Cancel
                    </Button>
                  )}
                  {appointment.status === "pending" && (
                    <p className="text-xs text-muted-foreground text-right">Waiting for lawyer response</p>
                  )}
                  {appointment.status === "cancelled" && (
                    <p className="text-xs text-muted-foreground text-right italic">This appointment was cancelled</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
