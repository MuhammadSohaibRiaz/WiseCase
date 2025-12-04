"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

export type NotificationType =
  | "system"
  | "message"
  | "appointment_request"
  | "appointment_update"
  | "case_update"
  | "payment_update"

export interface NotificationPayload {
  user_id: string
  created_by?: string | null
  type: NotificationType
  title: string
  description?: string | null
  data?: Record<string, any> | null
}

async function resolveCreatedBy(supabase: SupabaseClient, explicit?: string | null) {
  if (explicit) return explicit
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function createNotification(
  payload: NotificationPayload,
  existingClient?: SupabaseClient,
): Promise<boolean> {
  try {
    const supabase = existingClient ?? createClient()
    const createdBy = await resolveCreatedBy(supabase, payload.created_by)

    const { error } = await supabase.from("notifications").insert({
      user_id: payload.user_id,
      created_by: createdBy ?? payload.user_id,
      type: payload.type,
      title: payload.title,
      description: payload.description ?? null,
      data: payload.data ?? {},
    })

    if (error) {
      console.error("[v0] Notification insert error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Notification unexpected error:", error)
    return false
  }
}

type AppointmentUpdateTemplate = "lawyer_accept" | "lawyer_reject" | "client_cancel"

const appointmentCopy: Record<
  AppointmentUpdateTemplate,
  (ctx: { caseTitle?: string | null; scheduledAt?: string }) => { title: string; description?: string }
> = {
  lawyer_accept: ({ caseTitle, scheduledAt }) => ({
    title: "Lawyer accepted your request",
    description: `${caseTitle || "Consultation"} • ${scheduledAt ? new Date(scheduledAt).toLocaleString() : ""}`,
  }),
  lawyer_reject: ({ caseTitle }) => ({
    title: "Lawyer declined your request",
    description: caseTitle || "Your pending appointment was rejected.",
  }),
  client_cancel: ({ caseTitle, scheduledAt }) => ({
    title: "Client cancelled the appointment",
    description: `${caseTitle || "Consultation"} • ${scheduledAt ? new Date(scheduledAt).toLocaleString() : ""}`,
  }),
}

export async function notifyAppointmentRequest(
  params: {
    lawyerId: string
    clientId: string
    caseTitle?: string
    scheduledAt?: string
    caseId: string
    appointmentId: string
  },
  existingClient?: SupabaseClient,
) {
  return createNotification(
    {
      user_id: params.lawyerId,
      created_by: params.clientId,
      type: "appointment_request",
      title: "New appointment request",
      description: `${params.caseTitle || "Consultation"} • ${params.scheduledAt ? new Date(params.scheduledAt).toLocaleString() : ""}`,
      data: {
        appointment_id: params.appointmentId,
        case_id: params.caseId,
        status: "pending",
      },
    },
    existingClient,
  )
}

export async function notifyAppointmentUpdate(
  template: AppointmentUpdateTemplate,
  params: {
    recipientId: string
    actorId: string
    caseTitle?: string
    scheduledAt?: string
    appointmentId: string
    caseId?: string
  },
  existingClient?: SupabaseClient,
) {
  const copy = appointmentCopy[template](params)
  return createNotification(
    {
      user_id: params.recipientId,
      created_by: params.actorId,
      type: "appointment_update",
      title: copy.title,
      description: copy.description,
      data: {
        appointment_id: params.appointmentId,
        case_id: params.caseId,
        status: template === "lawyer_accept" ? "scheduled" : template === "client_cancel" ? "cancelled" : "rejected",
      },
    },
    existingClient,
  )
}

export async function notifyMessage(
  params: {
    recipientId: string
    senderId: string
    caseId: string
    caseTitle?: string
    contentPreview: string
  },
  existingClient?: SupabaseClient,
) {
  return createNotification(
    {
      user_id: params.recipientId,
      created_by: params.senderId,
      type: "message",
      title: `New message${params.caseTitle ? ` in ${params.caseTitle}` : ""}`,
      description: params.contentPreview,
      data: {
        case_id: params.caseId,
      },
    },
    existingClient,
  )
}

export async function notifySystemEvent(
  params: {
    recipientId: string
    title: string
    description?: string
    data?: Record<string, any>
  },
  existingClient?: SupabaseClient,
) {
  return createNotification(
    {
      user_id: params.recipientId,
      created_by: params.recipientId,
      type: "system",
      title: params.title,
      description: params.description,
      data: params.data ?? {},
    },
    existingClient,
  )
}
