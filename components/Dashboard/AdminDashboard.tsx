"use client";

import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  const { user, profile } = useAuth()

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [teachingCount, setTeachingCount] = useState<number>(0);
  const [nonTeachingCount, setNonTeachingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchCounts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard/admin?userId=${user.id}`);
        const data = await res.json();
        if (res.ok && data) {
          setPendingCount(data.pendingCount || 0);
          setTeachingCount(data.teachingCount || 0);
          setNonTeachingCount(data.nonTeachingCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
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
          <p className="text-gray-400">Hello {profile?.first_name || user?.email || 'Admin'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Total Teaching</h3>
            <p className="text-3xl font-bold text-blue-400">{isLoading ? '—' : teachingCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Total NonTeaching</h3>
            <p className="text-3xl font-bold text-green-400">{isLoading ? '—' : nonTeachingCount}</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Pending Reviews</h3>
            <p className="text-3xl font-bold text-orange-400">{isLoading ? '—' : pendingCount}</p>
          </div>
        </div>


      </div>
    </div>
  );
}
