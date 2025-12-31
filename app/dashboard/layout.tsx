import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { DEMO_USER, DEMO_PROFILE } from "@/lib/demo-mode"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get("codetales_demo")?.value === "true"

  // If demo mode, use mock data
  if (isDemo) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardNav user={DEMO_USER as any} profile={DEMO_PROFILE as any} isDemo />
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  // Normal auth flow
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
