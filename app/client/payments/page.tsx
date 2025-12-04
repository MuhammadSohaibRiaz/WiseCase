import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, CreditCard } from "lucide-react"

export const metadata: Metadata = {
  title: "Payments & Invoices — Smart Lawyer Booking System",
  description: "Manage your payments and download invoices.",
}

export default function PaymentsPage() {
  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payments & Invoices</h1>
        <p className="text-muted-foreground mt-2">Track your payments and manage invoices</p>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 85,000</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 15,000</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunded</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 0</div>
            <p className="text-xs text-muted-foreground">No refunds</p>
          </CardContent>
        </Card>
      </section>

      {/* Payment History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Payment History</h2>
          <Button>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        </div>

        <div className="space-y-3">
          {[
            {
              case: "Property Dispute",
              lawyer: "Ahmed Hassan",
              amount: "PKR 50,000",
              date: "Jan 15, 2024",
              status: "Completed",
              statusColor: "bg-green-100 text-green-800",
            },
            {
              case: "Contract Review",
              lawyer: "Fatima Khan",
              amount: "PKR 35,000",
              date: "Jan 10, 2024",
              status: "Pending",
              statusColor: "bg-yellow-100 text-yellow-800",
            },
            {
              case: "Family Law",
              lawyer: "Ali Raza",
              amount: "PKR 25,000",
              date: "Dec 28, 2023",
              status: "Completed",
              statusColor: "bg-green-100 text-green-800",
            },
          ].map((payment, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-5 items-center">
                  <div>
                    <p className="font-medium">{payment.case}</p>
                    <p className="text-sm text-muted-foreground">{payment.lawyer}</p>
                  </div>

                  <div>
                    <p className="font-semibold">{payment.amount}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{payment.date}</p>
                  </div>

                  <div>
                    <Badge className={payment.statusColor}>{payment.status}</Badge>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Invoice
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
