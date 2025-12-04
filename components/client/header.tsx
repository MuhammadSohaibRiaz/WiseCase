"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface ClientHeaderProps {
  onMenuClick: () => void
}

export function ClientHeader({ onMenuClick }: ClientHeaderProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profileData) {
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const firstName = profile?.first_name || "User"
  const fullName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"
    : "User"
  const email = profile?.email || ""
  const initials = profile
    ? `${profile.first_name?.charAt(0) || ""}${profile.last_name?.charAt(0) || ""}`.toUpperCase() || "U"
    : "U"

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Menu Button */}
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Center: Welcome Message */}
        <div className="flex-1 ml-4 md:ml-0">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-foreground">Welcome back, {firstName}</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </>
          )}
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <span>{fullName}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>{email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/client/settings")}>Profile Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
