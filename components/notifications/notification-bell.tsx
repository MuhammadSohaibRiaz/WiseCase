"use client"

import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const supabase = createClient()

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          console.log("[NotificationBell] No active session")
          setNotifications([])
          setUnreadCount(0)
          return
        }

        const { data, error: fetchError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (fetchError) {
          console.error("[NotificationBell] Error fetching notifications:", fetchError)
          throw fetchError
        }

        console.log("[NotificationBell] Fetched notifications:", data?.length || 0)
        setNotifications(data || [])
        setUnreadCount((data || []).filter(n => !n.is_read).length)
      } catch (error: any) {
        console.error("[NotificationBell] Error:", error)
        setError(error.message || "Failed to load notifications")
        setNotifications([])
        setUnreadCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("[NotificationBell] Real-time update:", payload)
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleMarkAllAsRead = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", session.user.id)
        .eq("is_read", false)

      if (error) {
        console.error("[NotificationBell] Error marking as read:", error)
        return
      }

      console.log("[NotificationBell] Marked all as read")
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("[NotificationBell] Error:", error)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && unreadCount > 0) {
      // Mark all as read when opening dropdown
      handleMarkAllAsRead()
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={() => console.log("[NotificationBell] Button clicked")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] pointer-events-none"
            >
              {unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 z-50">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {!isLoading && unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-destructive">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-start justify-between w-full">
                  <p className="font-medium text-sm">{notification.title}</p>
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNotificationTime(notification.created_at)}
                </p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-primary cursor-pointer">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
