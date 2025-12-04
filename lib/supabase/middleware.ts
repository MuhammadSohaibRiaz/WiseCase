import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth", "/analyze", "/match", "/terms", "/privacy", "/client/lawyer"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/client/sign-in"
    return NextResponse.redirect(url)
  }

  // If authenticated, check user_type and protect routes
  if (user) {
    // Fetch user profile to get user_type
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()

    const userType = profile?.user_type

    // Protect lawyer routes - only lawyers can access
    if (pathname.startsWith("/lawyer/") && userType !== "lawyer") {
      const url = request.nextUrl.clone()
      url.pathname = userType === "client" ? "/client/dashboard" : "/auth/client/sign-in"
      return NextResponse.redirect(url)
    }

    // Protect client routes - only clients can access
    if (
      pathname.startsWith("/client/") &&
      !pathname.startsWith("/client/lawyer/") && // Allow public lawyer profile view
      userType !== "client"
    ) {
      const url = request.nextUrl.clone()
      url.pathname = userType === "lawyer" ? "/lawyer/dashboard" : "/auth/lawyer/sign-in"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
