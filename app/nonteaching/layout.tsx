"use client"

import { useAuth } from "@/context/AuthContext"
import NonTeachingSidebar from "@/components/Sidebar/NonTeachingSidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <div key={user?.id} className="flex h-screen bg-[#0f1117]">
      <NonTeachingSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}