"use client";

import NonTeachingSidebar from "@/components/Sidebar/NonTeachingSidebar";
import NonteachingDashboard from "@/components/Dashboard/NonteachingDashboard";
import { useAuth } from "@/context/AuthContext";


export default function Page() {
  const { loading } = useAuth();
  if (loading) return (
  <div className="flex h-screen items-center justify-center bg-[#0f1117]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
  </div>);
  return <NonteachingDashboard />;
}
