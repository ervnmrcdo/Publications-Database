"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle } from "lucide-react";

export default function TeachingDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [publicationCount, setPublicationCount] = useState<number>(0);
  const [pendingAppCount, setPendingAppCount] = useState<number>(0);
  const [validCount, setValidCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setPublicationCount(0);
    setPendingAppCount(0);
    setValidCount(0);
    setCompletedCount(0);
    setShowWarning(false);

    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    const fetchCounts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard/teaching?userId=${user.id}`);
        const data = await res.json();
        if (res.ok && data) {
          setPublicationCount(data.publicationCount || 0);
          setPendingAppCount(data.pendingAppCount || 0);
          setValidCount(data.validCount || 0);
          setCompletedCount(data.completedCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [user?.id]);

  const handleNewApplication = () => {
    if (completedCount > 0) {
      setShowWarning(true);
    } else {
      router.push("/teaching/awards");
    }
  };

  const proceedWithNewApplication = () => {
    setShowWarning(false);
    router.push("/teaching/awards");
  };

  return (
    <div className="flex-1 overflow-auto bg-[#0f1117] text-gray-300 p-8">
      

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Hello, {profile?.first_name || user?.email || 'Faculty'}!</p>
        </div>

        {/* some stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">My Publications</h3>
            <p className="text-3xl font-bold text-blue-400">{isLoading ? '—' : publicationCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Pending Applications</h3>
            <p className="text-3xl font-bold text-green-400">{isLoading ? '—' : pendingAppCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Validated Submissions</h3>
            <p className="text-3xl font-bold text-orange-400">{isLoading ? '—' : validCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Completed Applications</h3>
            <p className="text-3xl font-bold text-purple-400">{isLoading ? '—' : completedCount}</p>
          </div>
        </div>

        {/* actions */}
        <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => router.push("/teaching/profile")}>
              View Profile
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => router.push("/teaching/publications")}>
              View Publications
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => router.push("/teaching/submissions")}>
              View Submissions
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                    onClick={handleNewApplication}>
              New Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
