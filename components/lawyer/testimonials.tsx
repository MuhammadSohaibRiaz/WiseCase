"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    client: "Zainab Ahmed",
    role: "Business Owner",
    rating: 5,
    text: "Ahmed provided excellent legal guidance for our corporate restructuring. Highly professional and responsive.",
    avatar: "/client-avatar-1.jpg",
  },
  {
    id: 2,
    client: "Hassan Khan",
    role: "Individual Client",
    rating: 5,
    text: "Outstanding service! Resolved my property dispute efficiently and fairly. Highly recommended.",
    avatar: "/client-avatar-2.jpg",
  },
  {
    id: 3,
    client: "Amina Malik",
    role: "HR Manager",
    rating: 4,
    text: "Great help with employment contracts. Clear communication and thorough documentation.",
    avatar: "/client-avatar-3.jpg",
  },
]

export function ClientTestimonials() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Client Testimonials</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={testimonial.avatar || "/placeholder.svg"} />
                <AvatarFallback>{testimonial.client[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{testimonial.client}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>

            <div className="flex gap-1 mb-2">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              ))}
            </div>

            <p className="text-sm text-muted-foreground italic">"{testimonial.text}"</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
