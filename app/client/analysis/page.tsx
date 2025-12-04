import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, AlertTriangle, CheckCircle, Trash2 } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Case Analysis — Smart Lawyer Booking System",
  description: "Upload documents for AI-powered legal analysis and insights.",
}

export default function AICaseAnalysisPage() {
  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Case Analysis</h1>
        <p className="text-muted-foreground mt-2">Upload documents for intelligent legal analysis</p>
      </div>

      {/* Upload Section */}
      <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">Upload Your Document</h3>
              <p className="text-sm text-muted-foreground mt-1">Drag and drop or click to select</p>
            </div>
            <Button>Select File</Button>
            <p className="text-xs text-muted-foreground">Supported: PDF, DOC, DOCX (Max 10MB)</p>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Latest Analysis</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This is a commercial lease agreement between ABC Corporation and XYZ Properties. The contract outlines
                rental terms, payment schedules, and maintenance responsibilities for a 3-year period.
              </p>
              <Button variant="outline" size="sm">
                View Full Summary
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Legal Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["Lease Term", "Rent Payment", "Security Deposit", "Maintenance Clause", "Termination Rights"].map(
                (term) => (
                  <div key={term} className="flex items-center justify-between text-sm">
                    <span>{term}</span>
                    <Badge variant="secondary">Identified</Badge>
                  </div>
                ),
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-sm">Medium Risk</p>
                  <p className="text-xs text-muted-foreground">2 potential issues identified</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommended Lawyers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Ahmed Hassan", match: "95%" },
                { name: "Fatima Khan", match: "88%" },
                { name: "Ali Raza", match: "82%" },
              ].map((lawyer) => (
                <div key={lawyer.name} className="flex items-center justify-between text-sm">
                  <span>{lawyer.name}</span>
                  <Badge>{lawyer.match}</Badge>
                </div>
              ))}
              <Button className="w-full mt-3" size="sm">
                Find Matching Lawyers
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Analysis History */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Analysis History</h2>

        <div className="space-y-3">
          {[
            { name: "Commercial_Lease_Agreement.pdf", date: "2 days ago", status: "Completed" },
            { name: "Employment_Contract.pdf", date: "1 week ago", status: "Completed" },
            { name: "Property_Deed.pdf", date: "2 weeks ago", status: "Completed" },
          ].map((item, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {item.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
