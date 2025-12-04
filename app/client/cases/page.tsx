import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Eye, Star } from "lucide-react"

export const metadata: Metadata = {
  title: "My Cases — Smart Lawyer Booking System",
  description: "View and manage all your legal cases and consultations.",
}

export default function MyCasesPage() {
  const cases = [
    {
      id: 1,
      title: "Property Dispute Resolution",
      lawyer: "Ahmed Hassan",
      status: "In Progress",
      payment: "PKR 50,000",
      lastUpdate: "2 days ago",
      statusColor: "bg-blue-100 text-blue-800",
    },
    {
      id: 2,
      title: "Contract Review & Negotiation",
      lawyer: "Fatima Khan",
      status: "Pending",
      payment: "PKR 35,000",
      lastUpdate: "5 days ago",
      statusColor: "bg-yellow-100 text-yellow-800",
    },
    {
      id: 3,
      title: "Family Law Consultation",
      lawyer: "Ali Raza",
      status: "Completed",
      payment: "PKR 25,000",
      lastUpdate: "2 weeks ago",
      statusColor: "bg-green-100 text-green-800",
    },
  ]

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Cases</h1>
        <p className="text-muted-foreground mt-2">Track your ongoing and past legal consultations</p>
      </div>

      <div className="space-y-4">
        {cases.map((caseItem) => (
          <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-5 items-center">
                <div>
                  <h3 className="font-semibold">{caseItem.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">with {caseItem.lawyer}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={caseItem.statusColor}>{caseItem.status}</Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="font-medium">{caseItem.payment}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Last Update</p>
                  <p className="text-sm">{caseItem.lastUpdate}</p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  {caseItem.status === "Completed" && (
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
