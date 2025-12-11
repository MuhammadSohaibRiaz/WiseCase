import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
  console.warn("STRIPE_WEBHOOK_SECRET is not set - webhook verification will be skipped")
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      // For development, parse without verification
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (error: any) {
    console.error("[Stripe] Webhook signature verification failed:", error.message)
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const { appointment_id, payment_id } = session.metadata || {}

        if (appointment_id && payment_id) {
          // Update payment status
          await supabase
            .from("payments")
            .update({
              status: "completed",
              payment_method: session.payment_method_types?.[0] || "card",
              stripe_payment_id: session.payment_intent as string || session.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment_id)

          // Update appointment status to scheduled
          const { data: updatedAppointment } = await supabase
            .from("appointments")
            .update({
              status: "scheduled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", appointment_id)
            .select("case_id")
            .single()

          // Update case status to in_progress
          if (updatedAppointment?.case_id) {
            await supabase
              .from("cases")
              .update({
                status: "in_progress",
                updated_at: new Date().toISOString(),
              })
              .eq("id", updatedAppointment.case_id)

            console.log(`[Stripe] Updated case ${updatedAppointment.case_id} to in_progress`)
          }

          // Create notifications for client and lawyer
          const { data: appointment } = await supabase
            .from("appointments")
            .select("client_id, lawyer_id, cases(title)")
            .eq("id", appointment_id)
            .single()

          if (appointment) {
            // Notify client
            await supabase.from("notifications").insert({
              user_id: appointment.client_id,
              type: "payment_update",
              title: "Payment Successful",
              description: `Your payment for "${appointment.cases?.title || "consultation"}" has been confirmed.`,
              data: { appointment_id, payment_id },
            })

            // Notify lawyer
            if (appointment.lawyer_id) {
              await supabase.from("notifications").insert({
                user_id: appointment.lawyer_id,
                type: "payment_update",
                title: "Payment Received",
                description: `Payment received for consultation "${appointment.cases?.title || "appointment"}".`,
                data: { appointment_id, payment_id },
              })
            }
          }

          console.log(`[Stripe] Payment succeeded for appointment ${appointment_id}`)
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { appointment_id, payment_id } = paymentIntent.metadata

        if (appointment_id && payment_id) {
          // Update payment status
          await supabase
            .from("payments")
            .update({
              status: "completed",
              payment_method: paymentIntent.payment_method_types[0] || "card",
              stripe_payment_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment_id)

          // Update appointment status to scheduled
          const { data: updatedAppointment } = await supabase
            .from("appointments")
            .update({
              status: "scheduled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", appointment_id)
            .select("case_id")
            .single()

          // Update case status to in_progress
          if (updatedAppointment?.case_id) {
            await supabase
              .from("cases")
              .update({
                status: "in_progress",
                updated_at: new Date().toISOString(),
              })
              .eq("id", updatedAppointment.case_id)

            console.log(`[Stripe] Updated case ${updatedAppointment.case_id} to in_progress`)
          }

          // Create notifications for client and lawyer
          const { data: appointment } = await supabase
            .from("appointments")
            .select("client_id, lawyer_id, cases(title)")
            .eq("id", appointment_id)
            .single()

          if (appointment) {
            // Notify client
            await supabase.from("notifications").insert({
              user_id: appointment.client_id,
              type: "payment_update",
              title: "Payment Successful",
              description: `Your payment for "${appointment.cases?.title || "consultation"}" has been confirmed.`,
              data: { appointment_id, payment_id },
            })

            // Notify lawyer
            if (appointment.lawyer_id) {
              await supabase.from("notifications").insert({
                user_id: appointment.lawyer_id,
                type: "payment_update",
                title: "Payment Received",
                description: `Payment received for consultation "${appointment.cases?.title || "appointment"}".`,
                data: { appointment_id, payment_id },
              })
            }
          }

          console.log(`[Stripe] Payment succeeded for appointment ${appointment_id}`)
        }
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { appointment_id, payment_id } = paymentIntent.metadata

        if (payment_id) {
          await supabase
            .from("payments")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment_id)

          // Create notification for payment failure
          if (appointment_id) {
            const { data: appointment } = await supabase
              .from("appointments")
              .select("client_id, lawyer_id, cases(title)")
              .eq("id", appointment_id)
              .single()

            if (appointment) {
              // Notify client
              await supabase.from("notifications").insert({
                user_id: appointment.client_id,
                type: "payment_update",
                title: "Payment Failed",
                description: `Payment failed for "${appointment.cases?.title || "consultation"}". Please try again.`,
                data: { appointment_id, payment_id, status: "failed" },
              })

              // Notify lawyer
              if (appointment.lawyer_id) {
                await supabase.from("notifications").insert({
                  user_id: appointment.lawyer_id,
                  type: "payment_update",
                  title: "Payment Failed",
                  description: `Client payment failed for "${appointment.cases?.title || "consultation"}".`,
                  data: { appointment_id, payment_id, status: "failed" },
                })
              }
            }
          }

          console.log(`[Stripe] Payment failed for payment ${payment_id}`)
        }
        break
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[Stripe] Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

