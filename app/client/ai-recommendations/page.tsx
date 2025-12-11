"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Search } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AIRecommendationsPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        caseType: "",
        caseDescription: "",
        budget: "",
        location: "",
        urgency: ""
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Redirect to match page with filters
        const params = new URLSearchParams()
        if (formData.caseType) params.append("specialization", formData.caseType)
        if (formData.location) params.append("location", formData.location)
        router.push(`/match?${params.toString()}`)
    }

    return (
        <main className="min-h-screen bg-background py-8 px-4">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl md:text-4xl font-bold">AI Lawyer Recommendations</h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Tell us about your case and we'll find the best lawyers for you
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Case Details</CardTitle>
                        <CardDescription>
                            Provide information about your legal needs to get personalized lawyer recommendations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="caseType">Case Type *</Label>
                                <Select
                                    value={formData.caseType}
                                    onValueChange={(value) => setFormData({ ...formData, caseType: value })}
                                    required
                                >
                                    <SelectTrigger id="caseType">
                                        <SelectValue placeholder="Select case type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Criminal Law">Criminal Law</SelectItem>
                                        <SelectItem value="Family Law">Family Law</SelectItem>
                                        <SelectItem value="Corporate Law">Corporate Law</SelectItem>
                                        <SelectItem value="Civil Law">Civil Law</SelectItem>
                                        <SelectItem value="Intellectual Property">Intellectual Property</SelectItem>
                                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                                        <SelectItem value="Tax Law">Tax Law</SelectItem>
                                        <SelectItem value="Immigration">Immigration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="caseDescription">Case Description *</Label>
                                <textarea
                                    id="caseDescription"
                                    placeholder="Describe your legal situation in detail..."
                                    value={formData.caseDescription}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, caseDescription: e.target.value })}
                                    required
                                    rows={6}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget Range (PKR)</Label>
                                    <Input
                                        id="budget"
                                        type="text"
                                        placeholder="e.g., 50,000 - 100,000"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Preferred Location</Label>
                                    <Input
                                        id="location"
                                        type="text"
                                        placeholder="e.g., Karachi, Lahore, Online"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="urgency">Urgency Level</Label>
                                <Select
                                    value={formData.urgency}
                                    onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                                >
                                    <SelectTrigger id="urgency">
                                        <SelectValue placeholder="Select urgency level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low - Can wait a few weeks</SelectItem>
                                        <SelectItem value="medium">Medium - Need within a week</SelectItem>
                                        <SelectItem value="high">High - Urgent, need ASAP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="flex-1 gap-2">
                                    <Search className="h-4 w-4" />
                                    Find Matching Lawyers
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/client/dashboard")}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-8 p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">
                        <strong>Tip:</strong> The more details you provide, the better we can match you with the right lawyer.
                        Our AI analyzes your case description and finds lawyers with relevant experience and expertise.
                    </p>
                </div>
            </div>
        </main>
    )
}
