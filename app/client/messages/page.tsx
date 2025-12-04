import type { Metadata } from "next"
import { MessagesShell } from "@/components/chat/messages-shell"

export const metadata: Metadata = {
  title: "Messages — Smart Lawyer Booking System",
  description: "Chat with your lawyers and discuss your cases in real-time.",
}

export default function MessagesPage() {
  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">Secure, real-time chat with your legal team.</p>
      </div>

      <MessagesShell userType="client" />
    </main>
  )
}
