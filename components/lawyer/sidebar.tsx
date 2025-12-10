"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, TrendingUp, Star, Users, AlertCircle, Calendar, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

interface LawyerSidebarProps {
  onNavigate?: () => void
}

export function LawyerSidebar({ onNavigate }: LawyerSidebarProps) {
  const router = useRouter()
  
  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm md:text-base">Quick Actions</h3>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-xs md:text-sm"
            size="sm"
            onClick={() => {
              router.push("/lawyer/appointments")
              onNavigate?.()
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-xs md:text-sm"
            size="sm"
            onClick={() => {
              router.push("/lawyer/messages")
              onNavigate?.()
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-xs md:text-sm"
            size="sm"
            onClick={() => {
              router.push("/lawyer/cases")
              onNavigate?.()
            }}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Cases
          </Button>
        </div>
      </Card>
      {/* Profile Navigation */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm md:text-base">View profile</h3>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-xs md:text-sm" size="sm" onClick={onNavigate}>
            <span className="text-primary">📋</span> Corporate Law
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs md:text-sm" size="sm" onClick={onNavigate}>
            <span>📋</span> Family Law
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs md:text-sm" size="sm" onClick={onNavigate}>
            <span>📋</span> All specializations
          </Button>
        </div>
      </Card>

      {/* Key Metrics */}
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <h3 className="font-semibold mb-4">Your Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-sm">Total Cases</span>
            </div>
            <span className="font-bold text-lg">48</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm">Total Earnings</span>
            </div>
            <span className="font-bold text-lg">$12,500</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Avg Rating</span>
            </div>
            <span className="font-bold text-lg">4.9</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Active Clients</span>
            </div>
            <span className="font-bold text-lg">12</span>
          </div>
        </div>
      </Card>

      {/* Upgrade Banner */}
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mt-1">
              Get priority placement, advanced analytics, and more client requests.
            </p>
            <Button size="sm" className="mt-2 w-full">
              Upgrade Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Promote Section */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Promote your profile</h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Availability Badge</p>
            <Badge className="mt-1 bg-green-500/20 text-green-700 dark:text-green-400">Available</Badge>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
            Edit availability
          </Button>
        </div>
      </Card>

      {/* Connections */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Connections</p>
            <p className="text-2xl font-bold">24</p>
          </div>
          <Button variant="link" size="sm">
            View details
          </Button>
        </div>
      </Card>
    </div>
  )
}
