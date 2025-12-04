"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MessageSquare } from "lucide-react"

const activeCases = [
  {
    id: 1,
    title: "Corporate Merger Agreement Review",
    client: "TechCorp Solutions",
    status: "In Progress",
    hourlyRate: "$150/hr",
    description: "Review and negotiate merger agreement terms for acquisition deal.",
    daysActive: 5,
    messages: 12,
  },
  {
    id: 2,
    title: "Property Dispute Resolution",
    client: "Residential Client",
    status: "Pending Review",
    hourlyRate: "$120/hr",
    description: "Handle property boundary dispute between neighboring properties.",
    daysActive: 2,
    messages: 8,
  },
  {
    id: 3,
    title: "Employment Contract Drafting",
    client: "StartUp Inc",
    status: "In Progress",
    hourlyRate: "$100/hr",
    description: "Draft comprehensive employment contracts for new hires.",
    daysActive: 3,
    messages: 15,
  },
]

export function ActiveCases() {
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Active Cases</h2>
        <Button variant="outline" size="sm" className="text-xs md:text-sm bg-transparent">
          View all
        </Button>
      </div>

      <div className="space-y-3">
        {activeCases.map((caseItem) => (
          <Card key={caseItem.id} className="p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-semibold text-base md:text-lg">{caseItem.title}</h3>
                  <Badge variant={caseItem.status === "In Progress" ? "default" : "secondary"} className="text-xs">
                    {caseItem.status}
                  </Badge>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-2">{caseItem.client}</p>
                <p className="text-xs md:text-sm mb-3">{caseItem.description}</p>

                <div className="flex gap-3 md:gap-4 text-xs text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {caseItem.daysActive} days active
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {caseItem.messages} messages
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start w-full md:w-auto gap-3">
                <p className="font-semibold text-primary text-sm md:text-base">{caseItem.hourlyRate}</p>
                <Button size="sm" className="gap-2 text-xs md:text-sm">
                  <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                  Message
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
