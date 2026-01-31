"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { useAppStore } from "@/stores"
// import { initializeDemoData } from "@/lib/storage" // Removed
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { initialize, isInitialized, sidebarOpen, currentUser, isLoading } = useAppStore()

  const isLoginPage = pathname === "/login"

  useEffect(() => {
    // initializeDemoData() // Removed
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isInitialized && !currentUser && !isLoginPage && !isLoading) {
      router.push("/login")
    }
  }, [isInitialized, currentUser, isLoginPage, router, isLoading])

  if (!isInitialized || (isLoading && !currentUser && !isLoginPage)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          "pt-14 transition-all duration-300",
          sidebarOpen ? "pl-64" : "pl-16"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
