"use client"

import { useAuth } from "@/context/AuthContext"
import TeachingSidebar from "@/components/Sidebar/TeachingSidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <div key={user?.id} className="flex h-screen bg-[#0f1117]">
      <TeachingSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}