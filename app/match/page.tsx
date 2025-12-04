"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { LawyerCard } from "@/components/lawyer/lawyer-card"
import { LawyerFilters, type FilterState } from "@/components/lawyer/lawyer-filters"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface LawyerProfile {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  bio: string | null
  location: string | null
  profile: {
    email: string
    phone: string | null
  } | null
  lawyer_profile: {
    specializations: string[]
    average_rating: number
    total_cases: number
    hourly_rate: number
    response_time_hours: number
    verified: boolean
    is_profile_active: boolean
  } | null
}

export default function MatchPage() {
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([])
  const [filteredLawyers, setFilteredLawyers] = useState<LawyerProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    specializations: [],
    minRating: 0,
    maxRate: 500,
    availability: null,
    location: "",
  })
  const { toast } = useToast()

  // Fetch lawyers from Supabase
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        // First, try to fetch lawyers with lawyer_profiles join
        let { data, error } = await supabase
          .from("profiles")
          .select(
            `
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            location,
            availability_status,
            lawyer_profiles (
              specializations,
              average_rating,
              total_cases,
              hourly_rate,
              response_time_hours,
              verified,
              is_profile_active
            )
          `,
          )
          .eq("user_type", "lawyer")

        // If error or no data, try fetching just profiles (lawyer_profiles might not exist yet)
        if (error || !data || data.length === 0) {
          console.log("[v0] First query failed or returned no data, trying without lawyer_profiles join")
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url, bio, location, availability_status")
            .eq("user_type", "lawyer")

          if (profilesError) {
            error = profilesError
            data = null
          } else {
            // Manually fetch lawyer_profiles for each lawyer
            data = profilesData
            if (data && data.length > 0) {
              const lawyerIds = data.map((p: any) => p.id)
              const { data: lawyerProfilesData } = await supabase
                .from("lawyer_profiles")
                .select("*")
                .in("id", lawyerIds)

              // Attach lawyer_profiles to each profile
              data = data.map((profile: any) => {
                const matchingProfile = lawyerProfilesData?.find((lp: any) => lp.id === profile.id)
                return {
                  ...profile,
                  lawyer_profiles: matchingProfile ? [matchingProfile] : [],
                }
              })
              console.log("[v0] Manually attached lawyer_profiles:", data)
            }
          }
        }

        if (error) {
          console.error("[v0] Supabase error:", error)
          console.error("[v0] Error details:", JSON.stringify(error, null, 2))
          toast({
            title: "Error",
            description: `Failed to load lawyers: ${error.message}`,
            variant: "destructive",
          })
          return
        }

        console.log("[v0] Raw data from Supabase:", JSON.stringify(data, null, 2))
        console.log("[v0] Number of lawyers found:", data?.length || 0)
        
        // Log first lawyer's data structure for debugging
        if (data && data.length > 0) {
          console.log("[v0] First lawyer raw data:", JSON.stringify(data[0], null, 2))
          console.log("[v0] First lawyer lawyer_profiles:", data[0].lawyer_profiles)
        }

        // Filter and map lawyers data
        // Show lawyers even if lawyer_profiles doesn't exist yet (will be created by trigger)
        // Only hide if explicitly set to inactive (is_profile_active === false)
        const lawyersData = (data || [])
          .filter((lawyer: any) => {
            // Handle both array and object formats
            const profile = Array.isArray(lawyer.lawyer_profiles)
              ? lawyer.lawyer_profiles[0]
              : lawyer.lawyer_profiles

            console.log(`[v0] Filtering lawyer ${lawyer.id}:`, {
              hasProfile: !!profile,
              isProfileActive: profile?.is_profile_active,
              willShow: !profile || profile.is_profile_active !== false,
              rawLawyerProfiles: lawyer.lawyer_profiles,
            })
            // Show lawyer if:
            // 1. No lawyer_profiles record exists yet (will be created by trigger)
            // 2. lawyer_profiles exists and is_profile_active is not explicitly false
            return !profile || profile.is_profile_active !== false
          })
          .map((lawyer: any) => {
            // Handle both array and object formats for lawyer_profiles
            const profile = Array.isArray(lawyer.lawyer_profiles)
              ? lawyer.lawyer_profiles[0]
              : lawyer.lawyer_profiles

            console.log(`[v0] Mapping lawyer ${lawyer.id}:`, {
              profile: profile,
              hourly_rate: profile?.hourly_rate,
              average_rating: profile?.average_rating,
              total_cases: profile?.total_cases,
            })

            return {
              id: lawyer.id,
              first_name: lawyer.first_name || "",
              last_name: lawyer.last_name || "",
              avatar_url: lawyer.avatar_url,
              bio: lawyer.bio,
              location: lawyer.location,
              availability_status: lawyer.availability_status || "available",
              specializations: profile?.specializations || [],
              // Convert to numbers, handling null/undefined
              average_rating: profile?.average_rating != null ? Number(profile.average_rating) : 0,
              total_cases: profile?.total_cases != null ? Number(profile.total_cases) : 0,
              hourly_rate: profile?.hourly_rate != null ? Number(profile.hourly_rate) : 0,
              response_time_hours: profile?.response_time_hours != null ? Number(profile.response_time_hours) : 24,
              verified: profile?.verified === true,
              is_profile_active: profile?.is_profile_active !== false,
            }
          })

        setLawyers(lawyersData)
        setFilteredLawyers(lawyersData)
      } catch (error) {
        console.error("[v0] Fetch error:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLawyers()
  }, [toast])

  // Apply filters
  useEffect(() => {
    let result = lawyers

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (lawyer) =>
          `${lawyer.first_name} ${lawyer.last_name}`.toLowerCase().includes(searchLower) ||
          lawyer.bio?.toLowerCase().includes(searchLower),
      )
    }

    // Location filter
    if (filters.location) {
      result = result.filter(
        (lawyer) =>
          lawyer.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
          filters.location.toLowerCase() === "online",
      )
    }

    // Specialization filter
    if (filters.specializations.length > 0) {
      result = result.filter((lawyer) =>
        filters.specializations.some((spec) => lawyer.specializations.some((s) => s.includes(spec))),
      )
    }

    // Rating filter
    if (filters.minRating > 0) {
      result = result.filter((lawyer) => lawyer.average_rating >= filters.minRating)
    }

    // Rate filter
    if (filters.maxRate < 500) {
      result = result.filter((lawyer) => lawyer.hourly_rate <= filters.maxRate)
    }

    // Availability filter
    if (filters.availability) {
      result = result.filter((lawyer) => lawyer.availability_status === filters.availability)
    }

    setFilteredLawyers(result)
  }, [lawyers, filters])

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">Find Your Perfect Lawyer</h1>
          <p className="text-lg text-muted-foreground">
            Search through our network of verified lawyers and book a consultation today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <LawyerFilters onFilterChange={setFilters} isLoading={isLoading} />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLawyers.length === 0 ? (
              <div className="text-center py-16 rounded-lg border border-border bg-card p-8">
                <p className="text-lg text-muted-foreground mb-2">No lawyers found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters to find more options.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Found {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLawyers.map((lawyer) => (
                    <LawyerCard
                      key={lawyer.id}
                      id={lawyer.id}
                      name={`${lawyer.first_name} ${lawyer.last_name}`}
                      avatar_url={lawyer.avatar_url}
                      bio={lawyer.bio}
                      specializations={lawyer.specializations}
                      average_rating={lawyer.average_rating}
                      total_cases={lawyer.total_cases}
                      location={lawyer.location}
                      hourly_rate={lawyer.hourly_rate}
                      response_time_hours={lawyer.response_time_hours}
                      verified={lawyer.verified}
                      availability_status={lawyer.availability_status}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
