"use client";

import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import { useRouter, usePathname } from "next/navigation";

export default function TeachingDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null)
  const [first_name, setFirstName] = useState<string | null>(null)

  const [publicationCount, setPublicationCount] = useState<number>(0);
  const [pendingAppCount, setPendingAppCount] = useState<number>(0);
  const [validCount, setValidCount] = useState<number>(0); // valid count is validated submissions

  useEffect(() => {
    const supabase = createClient();
    const getUserAndCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('first_name')
          .eq('id', user.id)
          .single();
        if (profile) {
          setFirstName(profile.first_name);
        }

        const { count: pubCount } = await supabase
          .from('publication_authors')
          .select('publication_id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setPublicationCount(pubCount || 0);

        const { count: pendingCount } = await supabase
          .from('submissions')
          .select('submission_id', { count: 'exact', head: true })
          .eq('submitter_id', user.id)
          .eq('status', 'PENDING');
        setPendingAppCount(pendingCount || 0);

        const { count: validatedCount } = await supabase
          .from('submissions')
          .select('submission_id', { count: 'exact', head: true })
          .eq('submitter_id', user.id)
          .eq('status', 'VALIDATED');
        setValidCount(validatedCount || 0);
      }
    };
    getUserAndCounts();
  }, []);

  return (
    <div className="flex-1 overflow-auto bg-[#0f1117] text-gray-300 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Hello, {first_name || user?.email || 'Faculty'}!</p>
        </div>

        {/* some stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">My Publications</h3>
            <p className="text-3xl font-bold text-blue-400">{publicationCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Pending Applications</h3>
            <p className="text-3xl font-bold text-green-400">{pendingAppCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Validated Submissions</h3>
            <p className="text-3xl font-bold text-orange-400">{validCount}</p>
          </div>
        </div>

        {/* actions */}
        <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            
          </div>
        </div>
      </div>
    </div>
  );
}
