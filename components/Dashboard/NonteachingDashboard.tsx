"use client";

import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client'
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function NonteachingDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [publicationCount, setPublicationCount] = useState<number>(0);
  const [pendingAppCount, setPendingAppCount] = useState<number>(0);
  const [validCount, setValidCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPublicationCount(0);
    setPendingAppCount(0);
    setValidCount(0);

    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchCounts = async () => {
      setIsLoading(true);
      try {
        const [{ count: pubCount }, { count: pendingCount }, { count: validatedCount }] =
          await Promise.all([
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
              .select('submission_id', { count: 'exact', head: true })
              .eq('submitter_id', user.id)
              .eq('status', 'VALIDATED'),
          ]);

        setPublicationCount(pubCount || 0);
        setPendingAppCount(pendingCount || 0);
        setValidCount(validatedCount || 0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [user?.id]);

  return (
    <div className="flex-1 overflow-auto bg-[#0f1117] text-gray-300 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Hello, {profile?.first_name || user?.email || 'Student'}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">My Publications</h3>
            <p className="text-3xl font-bold text-blue-400">
              {isLoading ? '—' : publicationCount}
            </p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Pending Applications</h3>
            <p className="text-3xl font-bold text-green-400">
              {isLoading ? '—' : pendingAppCount}
            </p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Validated Submissions</h3>
            <p className="text-3xl font-bold text-orange-400">
              {isLoading ? '—' : validCount}
            </p>
          </div>
        </div>

        <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => router.push("/nonteaching/profile")}>
              View Profile
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => router.push("/nonteaching/publications")}>
              View Publications
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => router.push("/nonteaching/submissions")}>
              View Submissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}