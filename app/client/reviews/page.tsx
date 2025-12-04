import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

export const metadata: Metadata = {
  title: "Reviews — Smart Lawyer Booking System",
  description: "Leave and view reviews for your lawyers.",
}

export default function ReviewsPage() {
  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground mt-2">Share your experience with lawyers</p>
      </div>

      {/* Pending Reviews */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Pending Reviews</h2>

        <div className="space-y-3">
          {[
            { lawyer: "Ahmed Hassan", case: "Property Dispute", date: "Completed Jan 15" },
            { lawyer: "Fatima Khan", case: "Contract Review", date: "Completed Jan 10" },
          ].map((item, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.lawyer}`} />
                      <AvatarFallback>{item.lawyer.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{item.lawyer}</p>
                      <p className="text-sm text-muted-foreground">{item.case}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                    </div>
                  </div>
                  <Button>Leave Review</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Submitted Reviews */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Your Reviews</h2>

        <div className="space-y-4">
          {[
            {
              lawyer: "Ali Raza",
              case: "Family Law Consultation",
              rating: 5,
              comment: "Excellent service! Very professional and understanding. Highly recommended.",
              date: "2 weeks ago",
            },
            {
              lawyer: "Sarah Ahmed",
              case: "Employment Law",
              rating: 4,
              comment: "Great lawyer with good expertise. Would work with again.",
              date: "1 month ago",
            },
          ].map((review, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.lawyer}`} />
                      <AvatarFallback>{review.lawyer.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.lawyer}</p>
                      <p className="text-sm text-muted-foreground">{review.case}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>

                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
