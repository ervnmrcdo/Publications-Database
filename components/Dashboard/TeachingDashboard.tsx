"use client";

import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle } from "lucide-react";

const supabase = createClient();
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

    if (!user) {
      setIsLoading(false);
      return;
    }
    const fetchCounts = async () => {
      setIsLoading(true);
      try {
        const [
          { count: pubCount },
          { count: pendingCount },
          { data: validatedData }
        ] = await Promise.all([
          supabase
            .from('publication_authors')
            .select('publication_id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('submissions')
            .select('submission_id', { count: 'exact', head: true })
            .eq('submitter_id', user.id)
            .eq('status', 'PENDING'),
          supabase
            .from('submissions')
            .select('submission_id, status')
            .eq('submitter_id', user.id)
            .in('status', ['VALIDATED', 'PENDING_SUBMISSION', 'SUBMITTED', 'PROCESSED']),
        ]);

        setPublicationCount(pubCount || 0);
        setPendingAppCount(pendingCount || 0);
        setValidCount(validatedData?.filter((s: any) => s.status === 'VALIDATED').length || 0);
        setCompletedCount(validatedData?.length || 0);
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
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1b1e2b] p-6 rounded-lg max-w-md border border-yellow-600">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-white">Existing Applications Found</h3>
            </div>
            <p className="text-gray-300 mb-4">
              You have {completedCount} existing application{completedCount > 1 ? 's' : ''} that have been validated or processed.
              Are you sure you want to create a new application?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithNewApplication}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create New Application
              </button>
            </div>
          </div>
        </div>
      )}

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
