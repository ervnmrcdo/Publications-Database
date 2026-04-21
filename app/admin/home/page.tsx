"use client";

import AdminSidebar from "@/components/Sidebar/AdminSidebar";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";
import { useAuth } from "@/context/AuthContext";


export default function Page() {
  const { loading } = useAuth();
  if (loading) return (
  <div className="flex h-screen items-center justify-center bg-[#0f1117]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
  </div>);
  return (
    <div className="flex h-screen bg-[#0f1117]">
      <AdminSidebar />
      <main className="flex-1 bg-[#0f1117] overflow-y-auto">
        <AdminDashboard />
      </main>
    </div>
  );
}
