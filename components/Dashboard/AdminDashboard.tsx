"use client";

import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from "next/navigation";

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [teachingCount, setTeachingCount] = useState<number>(0);
  const [nonTeachingCount, setNonTeachingCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/pendingAwards")
      .then((res) => res.json())
      .then((result) => {
        setPendingCount(result.length || 0);
      });
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: teaching } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teaching');
      
      const { count: nonTeaching } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'nonteaching');

      setTeachingCount(teaching || 0);
      setNonTeachingCount(nonTeaching || 0);
    };

    fetchCounts();
  }, [supabase]);

  return (
    <div className="flex-1 overflow-auto bg-[#0f1117] text-gray-300 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Hello {profile?.first_name || user?.email || 'Admin'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Total Teaching</h3>
            <p className="text-3xl font-bold text-blue-400">{teachingCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Total NonTeaching</h3>
            <p className="text-3xl font-bold text-green-400">{nonTeachingCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Pending Reviews</h3>
            <p className="text-3xl font-bold text-orange-400">{pendingCount}</p>
          </div>
        </div>


      </div>
    </div>
  );
}
