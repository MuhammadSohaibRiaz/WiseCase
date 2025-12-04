"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, Loader2, Trash2 } from "lucide-react"
import { FileUpload } from "@/components/auth/file-upload"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Certification {
  id: string
  title: string
  issuer: string
  issue_date?: string
  expiry_date?: string
}

const SPECIALIZATIONS = [
  "Corporate Law",
  "Family Law",
  "Real Estate",
  "Criminal Law",
  "Immigration",
  "Tax Law",
  "Labor Law",
  "Intellectual Property",
  "Bankruptcy",
]

export default function LawyerProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // States
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [lawyerProfile, setLawyerProfile] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [showCertForm, setShowCertForm] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    licenseNumber: "",
    bio: "",
    hourlyRate: "",
    responseTime: 24,
    availability: "available",
    minConsultationHours: 1,
  })

  const [specializations, setSpecializations] = useState<string[]>([])

  const [certificationForm, setCertificationForm] = useState({
    title: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/lawyer/sign-in")
          return
        }

        setUser(user)

        const [profileResult, lawyerResult, certsResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("lawyer_profiles").select("*").eq("id", user.id).single(),
          supabase.from("certifications").select("*").eq("lawyer_id", user.id),
        ])

        if (profileResult.data) {
          setProfile(profileResult.data)
          setFormData((prev) => ({
            ...prev,
            firstName: profileResult.data.first_name || "",
            lastName: profileResult.data.last_name || "",
            email: profileResult.data.email || user.email || "",
            phone: profileResult.data.phone || "",
            city: profileResult.data.location || "",
            licenseNumber: profileResult.data.bar_license_number || "",
            bio: profileResult.data.bio || "",
          }))
        }

        if (lawyerResult.data) {
          setLawyerProfile(lawyerResult.data)
          setFormData((prev) => ({
            ...prev,
            hourlyRate: lawyerResult.data.hourly_rate || "",
            responseTime: lawyerResult.data.response_time_hours || 24,
            minConsultationHours: lawyerResult.data.min_consultation_hours || 1,
            availability: lawyerResult.data.is_profile_active ? "available" : "unavailable",
          }))
          if (lawyerResult.data.specializations) {
            setSpecializations(lawyerResult.data.specializations)
          }
        }

        if (certsResult.data) {
          setCertifications(certsResult.data)
        }
      } catch (error) {
        console.error("Error loading lawyer data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [supabase, router, toast])

  const handleProfilePictureUpload = async (file: File) => {
    if (!user) return

    try {
      setIsUploading(true)

      const fileName = `${user.id}-${Date.now()}`
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)

      if (updateError) throw updateError

      // Reload profile from database
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (profileData) {
        setProfile(profileData)
      }

      toast({
        title: "✅ Success",
        description: "Your profile picture has been updated successfully!",
      })
    } catch (error: any) {
      console.error("Error uploading profile picture:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateProfessionalInfo = async () => {
    if (!user) return

    try {
      setLoading(true)

      const updateData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        location: formData.city,
        bar_license_number: formData.licenseNumber,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      }

      const { error: profileError } = await supabase.from("profiles").update(updateData).eq("id", user.id)

      if (profileError) throw profileError

      const lawyerUpdateData: any = {
        hourly_rate: Number.parseFloat(formData.hourlyRate) || 0,
        response_time_hours: formData.responseTime,
        min_consultation_hours: formData.minConsultationHours,
        is_profile_active: formData.availability === "available",
        updated_at: new Date().toISOString(),
      }

      const { error: lawyerError } = await supabase.from("lawyer_profiles").update(lawyerUpdateData).eq("id", user.id)

      if (lawyerError) throw lawyerError

      // Reload data from Supabase to ensure consistency
      const [profileResult, lawyerResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("lawyer_profiles").select("*").eq("id", user.id).single(),
      ])

      if (profileResult.data) {
        setProfile(profileResult.data)
        setFormData((prev) => ({
          ...prev,
          firstName: profileResult.data.first_name || "",
          lastName: profileResult.data.last_name || "",
          phone: profileResult.data.phone || "",
          city: profileResult.data.location || "",
          licenseNumber: profileResult.data.bar_license_number || "",
          bio: profileResult.data.bio || "",
        }))
      }

      if (lawyerResult.data) {
        setLawyerProfile(lawyerResult.data)
        setFormData((prev) => ({
          ...prev,
          hourlyRate: lawyerResult.data.hourly_rate || "",
          responseTime: lawyerResult.data.response_time_hours || 24,
          minConsultationHours: lawyerResult.data.min_consultation_hours || 1,
          availability: lawyerResult.data.is_profile_active ? "available" : "unavailable",
        }))
        if (lawyerResult.data.specializations) {
          setSpecializations(lawyerResult.data.specializations)
        }
      }

      toast({
        title: "✅ Success",
        description: "Your professional information has been saved successfully!",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to update professional information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSpecializations = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from("lawyer_profiles")
        .update({
          specializations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Reload specializations from database
      const { data: lawyerData } = await supabase
        .from("lawyer_profiles")
        .select("specializations")
        .eq("id", user.id)
        .single()

      if (lawyerData?.specializations) {
        setSpecializations(lawyerData.specializations)
      }

      toast({
        title: "✅ Success",
        description: "Your specializations have been updated successfully!",
      })
    } catch (error: any) {
      console.error("Error updating specializations:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to update specializations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCertification = async () => {
    if (!user || !certificationForm.title || !certificationForm.issuer) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("certifications")
        .insert({
          lawyer_id: user.id,
          title: certificationForm.title,
          issuer: certificationForm.issuer,
          issue_date: certificationForm.issueDate || null,
          expiry_date: certificationForm.expiryDate || null,
        })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        // Reload certifications from database
        const { data: certsData } = await supabase.from("certifications").select("*").eq("lawyer_id", user.id)
        if (certsData) {
          setCertifications(certsData)
        }
        setCertificationForm({
          title: "",
          issuer: "",
          issueDate: "",
          expiryDate: "",
        })
        setShowCertForm(false)

        toast({
          title: "✅ Success",
          description: "Certification has been added successfully!",
        })
      }
    } catch (error: any) {
      console.error("Error adding certification:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to add certification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCertification = async (certId: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) return

    try {
      setLoading(true)

      const { error } = await supabase.from("certifications").delete().eq("id", certId)

      if (error) throw error

      // Reload certifications from database
      const { data: certsData } = await supabase.from("certifications").select("*").eq("lawyer_id", user.id)
      if (certsData) {
        setCertifications(certsData)
      }

      toast({
        title: "✅ Success",
        description: "Certification has been deleted successfully!",
      })
    } catch (error: any) {
      console.error("Error deleting certification:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to delete certification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setPasswordLoading(true)

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      })

      if (authError) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        })
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (updateError) throw updateError

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "✅ Success",
        description: "Your password has been updated successfully!",
      })
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const currentPassword = prompt("Please enter your current password to confirm account deletion:")
    if (!currentPassword) {
      toast({
        title: "Cancelled",
        description: "Account deletion cancelled",
      })
      return
    }

    if (!confirm("Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.")) {
      return
    }

    try {
      setLoading(true)

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (authError) {
        toast({
          title: "Error",
          description: "Incorrect password. Account deletion cancelled.",
          variant: "destructive",
        })
        return
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) throw deleteError

      toast({
        title: "✅ Success",
        description: "Account deleted successfully. Redirecting...",
      })

      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !profile) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    )
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your professional profile and preferences</p>
      </div>

      <Tabs defaultValue="professional" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="specializations">Specializations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Professional Info Tab */}
        <TabsContent value="professional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload a professional profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {formData.firstName.charAt(0)}
                    {formData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <FileUpload onFileSelect={handleProfilePictureUpload} currentImageUrl={profile?.avatar_url} />
              </div>
              {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Update your professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={formData.email} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">License Number</label>
                  <Input
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Professional Bio</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateProfessionalInfo} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rates & Availability</CardTitle>
              <CardDescription>Set your hourly rate and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hourly Rate (PKR)</label>
                  <Input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min. Consultation Hours</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.minConsultationHours}
                    onChange={(e) =>
                      setFormData({ ...formData, minConsultationHours: Number.parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Response Time (hours)</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.responseTime}
                    onChange={(e) => setFormData({ ...formData, responseTime: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Availability</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="limited">Limited</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleUpdateProfessionalInfo} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Specializations Tab */}
        <TabsContent value="specializations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Areas</CardTitle>
              <CardDescription>Select your areas of legal practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SPECIALIZATIONS.map((specialty) => (
                  <label
                    key={specialty}
                    className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={specializations.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSpecializations([...specializations, specialty])
                        } else {
                          setSpecializations(specializations.filter((s) => s !== specialty))
                        }
                      }}
                    />
                    <span className="text-sm font-medium">{specialty}</span>
                  </label>
                ))}
              </div>
              <Button onClick={handleUpdateSpecializations} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Add your professional certifications and qualifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="p-3 border rounded-lg flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{cert.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {cert.issuer} {cert.issue_date && `• ${new Date(cert.issue_date).getFullYear()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCertification(cert.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {!showCertForm ? (
                <Button variant="outline" onClick={() => setShowCertForm(true)}>
                  Add Certification
                </Button>
              ) : (
                <div className="space-y-3 p-3 border rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Certificate Title*</label>
                    <Input
                      placeholder="e.g., Bar Association Member"
                      value={certificationForm.title}
                      onChange={(e) => setCertificationForm({ ...certificationForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issuer*</label>
                    <Input
                      placeholder="e.g., Pakistan Bar Council"
                      value={certificationForm.issuer}
                      onChange={(e) => setCertificationForm({ ...certificationForm, issuer: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Issue Date</label>
                      <Input
                        type="date"
                        value={certificationForm.issueDate}
                        onChange={(e) => setCertificationForm({ ...certificationForm, issueDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expiry Date</label>
                      <Input
                        type="date"
                        value={certificationForm.expiryDate}
                        onChange={(e) => setCertificationForm({ ...certificationForm, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddCertification} disabled={loading} size="sm">
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCertForm(false)
                        setCertificationForm({
                          title: "",
                          issuer: "",
                          issueDate: "",
                          expiryDate: "",
                        })
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password regularly for security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password *</label>
                <Input
                  type="password"
                  placeholder="Enter your current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={passwordLoading}>
                {passwordLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Delete Account</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
