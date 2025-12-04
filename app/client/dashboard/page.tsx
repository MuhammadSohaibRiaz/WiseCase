export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, FileText, DollarSign, MessageSquare, Star } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard — Smart Lawyer Booking System",
  description: "Your legal case overview, upcoming appointments, and AI recommendations.",
}

export default function ClientDashboardPage() {
  return (
    <main className="space-y-8">
      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Consultations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Ongoing cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 15,000</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Friday</div>
            <p className="text-xs text-muted-foreground">4:00 PM with Ahmed Hassan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 85,000</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Get AI analysis of your legal documents</p>
            <Button variant="outline" size="sm">
              Upload Now
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Find a Lawyer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Browse verified lawyers in your area</p>
            <Button variant="outline" size="sm">
              Browse Now
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">View AI-matched lawyers for your case</p>
            <Button variant="outline" size="sm">
              View Now
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Recommended Lawyers */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Recommended Lawyers</h2>
          <p className="text-muted-foreground">Based on your case analysis</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Ahmed Hassan",
              specialization: "Corporate Law",
              rating: 4.9,
              location: "Karachi",
              match: "95%",
            },
            {
              name: "Fatima Khan",
              specialization: "Family Law",
              rating: 4.8,
              location: "Lahore",
              match: "88%",
            },
            {
              name: "Ali Raza",
              specialization: "Property Law",
              rating: 4.7,
              location: "Islamabad",
              match: "82%",
            },
          ].map((lawyer, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{lawyer.name}</CardTitle>
                    <CardDescription>{lawyer.specialization}</CardDescription>
                  </div>
                  <Badge variant="secondary">{lawyer.match}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{lawyer.location}</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {lawyer.rating}
                  </span>
                </div>
                <Button className="w-full">Book Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Notifications */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Recent Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              title: "Appointment Confirmed",
              message: "Your appointment with Ahmed Hassan is confirmed for Friday, 4 PM.",
              time: "2 hours ago",
            },
            {
              title: "Document Analyzed",
              message: "Your contract document has been analyzed. View the AI summary.",
              time: "1 day ago",
            },
            {
              title: "Payment Received",
              message: "Payment of PKR 10,000 has been received by your lawyer.",
              time: "3 days ago",
            },
          ].map((notif, idx) => (
            <Card key={idx} className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{notif.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{notif.time}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
