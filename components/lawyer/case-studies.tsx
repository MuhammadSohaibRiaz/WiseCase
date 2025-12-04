"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2 } from "lucide-react"

const caseStudies = [
  {
    id: 1,
    title: "Successful Corporate Acquisition",
    category: "Corporate Law",
    outcome: "Won",
    image: "/corporate-law-case.jpg",
  },
  {
    id: 2,
    title: "Property Rights Dispute Resolution",
    category: "Real Estate",
    outcome: "Won",
    image: "/property-law-case.jpg",
  },
  {
    id: 3,
    title: "Employment Discrimination Case",
    category: "Employment Law",
    outcome: "Won",
    image: "/employment-law-case.jpg",
  },
]

export function CaseStudies() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Case Studies & Portfolio</h2>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add case study
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {caseStudies.map((study) => (
          <Card key={study.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted overflow-hidden">
              <img src={study.image || "/placeholder.svg"} alt={study.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <Badge variant="secondary" className="mb-2">
                {study.category}
              </Badge>
              <h3 className="font-semibold mb-2">{study.title}</h3>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">{study.outcome}</Badge>
                <Button variant="ghost" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
