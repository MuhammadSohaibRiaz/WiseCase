"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Bell, CheckCircle2, Loader2, MessageSquare, CalendarDays, Sparkles, CreditCard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type NotificationRecord = {
  id: string
  title: string
  description?: string | null
  type: "message" | "appointment_request" | "appointment_update" | "case_update"
  data?: Record<string, any> | null
  is_read: boolean
  created_at: string
}

const typeConfig: Record<NotificationRecord["type"], { icon: ReactNode; label: string; accent: string }> = {
  system: {
    icon: <Sparkles className="h-4 w-4 text-purple-600" />,
    label: "System",
    accent: "border-purple-200 bg-purple-50",
  },
  message: { icon: <MessageSquare className="h-4 w-4 text-blue-600" />, label: "Message", accent: "border-blue-200 bg-blue-50" },
  appointment_request: {
    icon: <CalendarDays className="h-4 w-4 text-orange-600" />,
    label: "Appointment",
    accent: "border-orange-200 bg-orange-50",
  },
  appointment_update: {
    icon: <CalendarDays className="h-4 w-4 text-emerald-600" />,
    label: "Appointment",
    accent: "border-emerald-200 bg-emerald-50",
  },
  case_update: { icon: <CheckCircle2 className="h-4 w-4 text-indigo-600" />, label: "Case", accent: "border-indigo-200 bg-indigo-50" },
  payment_update: {
    icon: <CreditCard className="h-4 w-4 text-rose-600" />,
    label: "Payment",
    accent: "border-rose-200 bg-rose-50",
  },
}

export function NotificationBell({ className }: { className?: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(25)

      if (error) {
        console.error("[v0] Notification fetch error:", error)
        return
      }

      setNotifications(data || [])
      setUnreadCount((data || []).filter((notification) => !notification.is_read).length)
    },
    [supabase],
  )

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.id) {
        setIsLoading(false)
        return
      }

      setUserId(user.id)
      await loadNotifications(user.id)
      setIsLoading(false)
    }

    init()
  }, [supabase, loadNotifications])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotification = payload.new as NotificationRecord
          setNotifications((prev) => [newNotification, ...prev].slice(0, 25))
          setUnreadCount((count) => count + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const markNotificationsAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("[v0] Notification update error:", error)
      return
    }

    setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
    setUnreadCount(0)
  }, [supabase, userId, unreadCount])

  if (isLoading || !userId) {
    return (
      <Button variant="ghost" size="icon" disabled className={cn("relative", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </Button>
    )
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          markNotificationsAsRead()
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-[10px] font-semibold text-white flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount === 0 ? (
            <span className="text-xs text-muted-foreground">All caught up 🎉</span>
          ) : (
            <span className="text-xs text-muted-foreground">{unreadCount} new</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled className="h-24 text-center text-muted-foreground">
            No notifications yet
          </DropdownMenuItem>
        ) : (
          notifications.map((notification) => {
            const config = typeConfig[notification.type] ?? {
              icon: <Bell className="h-4 w-4 text-muted-foreground" />,
              label: "General",
              accent: "border-border bg-muted/30",
            }
            return (
              <DropdownMenuItem
                key={notification.id}
                onSelect={(event) => event.preventDefault()}
                className={cn(
                  "flex flex-col items-start gap-1 py-3 cursor-default",
                  !notification.is_read && "bg-muted/40",
                )}
              >
                <div className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium", config.accent)}>
                  {config.icon}
                  <span>{config.label}</span>
                </div>
                <p className="text-sm font-semibold leading-tight">{notification.title}</p>
                {notification.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

