"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileText,
  User,
  ArrowLeft,
  Clock,
  DollarSign,
  Briefcase,
  Save,
} from "lucide-react"
import { LawyerDashboardHeader } from "@/components/lawyer/dashboard-header"
import { LawyerSidebar } from "@/components/lawyer/sidebar"
import { createNotification } from "@/lib/notifications"

interface CaseDetail {
  id: string
  title: string
  description: string | null
  status: "open" | "in_progress" | "completed" | "closed"
  case_type: string | null
  hourly_rate: number | null
  budget_min: number | null
  budget_max: number | null
  created_at: string
  updated_at: string
  client: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    email: string | null
  } | null
}

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  notes: string | null
}

interface Document {
  id: string
  file_name: string
  file_url: string
  file_type: string | null
  document_type: string | null
  status: string
  created_at: string
  uploaded_by: string
}

const statusConfig: Record<CaseDetail["status"], { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800",
  },
  closed: {
    label: "Closed",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
  },
}

export default function LawyerCaseDetailPage() {
  const params = useParams()
  const caseId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<CaseDetail["status"] | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lawyerId, setLawyerId] = useState<string | null>(null)

  const fetchCaseDetail = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.user?.id) {
        setError("Not authenticated")
        return
      }

      setLawyerId(sessionData.session.user.id)

      // Fetch case with client info
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select(
          `
          id,
          title,
          description,
          status,
          case_type,
          hourly_rate,
          budget_min,
          budget_max,
          created_at,
          updated_at,
          client_id,
          client:profiles!cases_client_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url,
            email
          )
        `,
        )
        .eq("id", caseId)
        .eq("lawyer_id", sessionData.session.user.id)
        .single()

      if (caseError) throw caseError
      if (!caseData) {
        setError("Case not found")
        return
      }

      const mappedCase: CaseDetail = {
        id: caseData.id,
        title: caseData.title,
        description: caseData.description,
        status: caseData.status,
        case_type: caseData.case_type,
        hourly_rate: caseData.hourly_rate,
        budget_min: caseData.budget_min,
        budget_max: caseData.budget_max,
        created_at: caseData.created_at,
        updated_at: caseData.updated_at,
        client: caseData.client || null,
      }

      setCaseDetail(mappedCase)
      setSelectedStatus(mappedCase.status)

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, scheduled_at, duration_minutes, status, notes")
        .eq("case_id", caseId)
        .order("scheduled_at", { ascending: false })

      if (appointmentsError) throw appointmentsError
      setAppointments(appointmentsData || [])

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("id, file_name, file_url, file_type, document_type, status, created_at, uploaded_by")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })

      if (documentsError) throw documentsError
      setDocuments(documentsData || [])

      setError(null)
    } catch (error) {
      console.error("[v0] Fetch error:", error)
      setError("Failed to load case details")
      toast({
        title: "Error",
        description: "Failed to load case details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [caseId, toast])

  useEffect(() => {
    if (caseId) {
      fetchCaseDetail()
    }
  }, [caseId, fetchCaseDetail])

  const handleStatusUpdate = async () => {
    if (!caseDetail || !selectedStatus || selectedStatus === caseDetail.status || !lawyerId) {
      return
    }

    try {
      setIsSaving(true)
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("cases")
        .update({
          status: selectedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", caseId)

      if (updateError) throw updateError

      // Send notification to client
      if (caseDetail.client?.id) {
        await createNotification(
          {
            user_id: caseDetail.client.id,
            created_by: lawyerId,
            type: "case_update",
            title: "Case status updated",
            description: `Your case "${caseDetail.title}" status has been changed to ${statusConfig[selectedStatus].label}`,
            data: {
              case_id: caseId,
              status: selectedStatus,
              previous_status: caseDetail.status,
            },
          },
          supabase,
        )
      }

      // Update local state
      setCaseDetail({ ...caseDetail, status: selectedStatus, updated_at: new Date().toISOString() })

      toast({
        title: "Success",
        description: "Case status updated successfully.",
      })
    } catch (error) {
      console.error("[v0] Status update error:", error)
      toast({
        title: "Error",
        description: "Failed to update case status.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LawyerDashboardHeader />
        <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !caseDetail) {
    return (
      <div className="min-h-screen bg-background">
        <LawyerDashboardHeader />
        <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <h2 className="font-semibold text-red-900">Error</h2>
              <p className="text-sm text-red-700">{error || "Case not found"}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/lawyer/cases")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[caseDetail.status]
  const clientName = caseDetail.client
    ? `${caseDetail.client.first_name || ""} ${caseDetail.client.last_name || ""}`.trim() || "Unknown Client"
    : "No client assigned"

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

          <main className="md:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => router.push("/lawyer/cases")} className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Cases
                </Button>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{caseDetail.title}</h1>
                  <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                </div>
                {caseDetail.case_type && <p className="text-muted-foreground mt-2">Type: {caseDetail.case_type}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(`/lawyer/messages?case=${caseDetail.id}`)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Case Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {caseDetail.description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">{caseDetail.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="text-sm font-medium">{clientName}</p>
                    </div>
                  </div>

                  {caseDetail.hourly_rate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Hourly Rate</p>
                        <p className="text-sm font-medium">${caseDetail.hourly_rate}/hr</p>
                      </div>
                    </div>
                  )}

                  {(caseDetail.budget_min || caseDetail.budget_max) && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-sm font-medium">
                          {caseDetail.budget_min && caseDetail.budget_max
                            ? `$${caseDetail.budget_min} - $${caseDetail.budget_max}`
                            : caseDetail.budget_min
                              ? `From $${caseDetail.budget_min}`
                              : `Up to $${caseDetail.budget_max}`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{new Date(caseDetail.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Current Status</p>
                    <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Update Status</p>
                    <Select value={selectedStatus || ""} onValueChange={(value) => setSelectedStatus(value as CaseDetail["status"])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStatus !== caseDetail.status && (
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={isSaving}
                      className="w-full"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Status
                        </>
                      )}
                    </Button>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Last updated: {new Date(caseDetail.updated_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Appointments ({appointments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No appointments scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(apt.scheduled_at).toLocaleDateString()} at{" "}
                            {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Duration: {apt.duration_minutes} minutes • Status: {apt.status}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                    {appointments.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">+{appointments.length - 5} more appointments</p>
                    )}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => router.push("/lawyer/appointments")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Appointments
                </Button>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents ({documents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.document_type || "Document"} • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {doc.status}
                          </Badge>
                          {doc.file_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Case Created */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      <div className="h-full w-px bg-border mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">Case Created</p>
                      <p className="text-xs text-muted-foreground">{new Date(caseDetail.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Status Changes */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5" />
                      <div className="h-full w-px bg-border mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">Status: {statusInfo.label}</p>
                      <p className="text-xs text-muted-foreground">Last updated: {new Date(caseDetail.updated_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Appointments */}
                  {appointments.slice(0, 3).map((apt, idx) => (
                    <div key={apt.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                        {idx < Math.min(appointments.length, 3) - 1 && <div className="h-full w-px bg-border mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">
                          Appointment {apt.status === "scheduled" ? "Scheduled" : apt.status === "completed" ? "Completed" : "Updated"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(apt.scheduled_at).toLocaleString()} • Status: {apt.status}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Documents */}
                  {documents.slice(0, 3).map((doc, idx) => (
                    <div key={doc.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5" />
                        {idx < Math.min(documents.length, 3) - 1 && <div className="h-full w-px bg-border mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">Document Uploaded: {doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleString()} • Status: {doc.status}
                        </p>
                      </div>
                    </div>
                  ))}

                  {appointments.length === 0 && documents.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}

