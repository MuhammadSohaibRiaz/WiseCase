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
  type: "system" | "message" | "appointment_request" | "appointment_update" | "case_update" | "payment_update"
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
      console.log(`[Notifications] Loading notifications for user: ${uid}`)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(25)

      if (error) {
        console.error("[Notifications] Fetch error:", error)
        return
      }

      console.log(`[Notifications] Loaded ${data?.length || 0} notifications`)
      setNotifications(data || [])
      const unread = (data || []).filter((notification) => !notification.is_read).length
      console.log(`[Notifications] Unread count: ${unread}`)
      setUnreadCount(unread)
    },
    [supabase],
  )

  useEffect(() => {
    const init = async () => {
      console.log("[Notifications] Initializing notification bell...")
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("[Notifications] Auth error:", authError)
        setIsLoading(false)
        return
      }

      if (!user?.id) {
        console.warn("[Notifications] No user found")
        setIsLoading(false)
        return
      }

      console.log(`[Notifications] User authenticated: ${user.id}`)
      setUserId(user.id)
      await loadNotifications(user.id)
      setIsLoading(false)
    }

    init()
  }, [supabase, loadNotifications])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "notifications", 
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          console.log("[Notifications] 📬 New notification received:", payload)
          const newNotification = payload.new as NotificationRecord
          console.log("[Notifications] Notification details:", {
            id: newNotification.id,
            title: newNotification.title,
            type: newNotification.type,
            is_read: newNotification.is_read,
          })
          setNotifications((prev) => {
            // Check if notification already exists (prevent duplicates)
            if (prev.find((n) => n.id === newNotification.id)) {
              console.log("[Notifications] ⚠️ Duplicate notification ignored:", newNotification.id)
              return prev
            }
            console.log("[Notifications] ✅ Adding new notification to list")
            return [newNotification, ...prev].slice(0, 25)
          })
          if (!newNotification.is_read) {
            console.log("[Notifications] 🔔 Incrementing unread count")
            setUnreadCount((count) => {
              const newCount = count + 1
              console.log(`[Notifications] Unread count: ${count} → ${newCount}`)
              return newCount
            })
          }
        },
      )
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "notifications", 
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          const updatedNotification = payload.new as NotificationRecord
          setNotifications((prev) => {
            const updated = prev.map((n) => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
            // Recalculate unread count
            const unread = updated.filter((n) => !n.is_read).length
            setUnreadCount(unread)
            return updated
          })
        },
      )
      .subscribe((status) => {
        console.log(`[Notifications] Subscription status: ${status} for user ${userId}`)
        if (status === "SUBSCRIBED") {
          console.log(`[Notifications] ✅ Successfully subscribed to notifications for user ${userId}`)
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[Notifications] ❌ Channel error for user ${userId}`)
        } else if (status === "TIMED_OUT") {
          console.warn(`[Notifications] ⏱️ Subscription timed out for user ${userId}`)
        } else if (status === "CLOSED") {
          console.warn(`[Notifications] 🔒 Subscription closed for user ${userId}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const markNotificationsAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)

    if (error) {
      console.error("[v0] Notification update error:", error)
      return
    }

    setNotifications((prev) => prev.map((notification) => 
      unreadIds.includes(notification.id) 
        ? { ...notification, is_read: true }
        : notification
    ))
    setUnreadCount(0)
  }, [supabase, userId, notifications, unreadCount])

  const handleOpenChange = useCallback((open: boolean) => {
    if (open && unreadCount > 0 && notifications.length > 0) {
      // Small delay to ensure dropdown is visible before marking as read
      setTimeout(() => {
        markNotificationsAsRead()
      }, 100)
    }
  }, [unreadCount, notifications.length, markNotificationsAsRead])

  if (isLoading || !userId) {
    return (
      <Button variant="ghost" size="icon" disabled className={cn("relative", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </Button>
    )
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
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
      <DropdownMenuContent 
        align="end" 
        className="w-80 sm:w-96 max-h-[28rem] overflow-y-auto z-[9999]"
        sideOffset={8}
        side="bottom"
        forceMount
      >
        <DropdownMenuLabel className="flex items-center justify-between sticky top-0 bg-background z-10 pb-2">
          <span className="font-semibold">Notifications</span>
          {unreadCount === 0 ? (
            <span className="text-xs text-muted-foreground">All caught up 🎉</span>
          ) : (
            <span className="text-xs text-muted-foreground">{unreadCount} new</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-[24rem] overflow-y-auto">
            {notifications.map((notification) => {
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
          })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

