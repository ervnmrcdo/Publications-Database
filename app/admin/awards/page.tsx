"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";

interface Award {
  award_id: number;
  title: string;
  description: string | null;
  allowed_type: 'JOURNAL' | 'BOOK' | null;
}

export default function Page() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/admin/awards/route");
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setAwards(data.awards);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (awardId: number, allowed_type: 'JOURNAL' | 'BOOK') => {
    setAwards(prev =>
      prev.map(a => a.award_id === awardId ? { ...a, allowed_type } : a)
    );
  };

  const handleSave = async (awardId: number) => {
    const award = awards.find(a => a.award_id === awardId);
    if (!award) return;

    setSaving(awardId);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/awards/route", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ award_id: awardId, allowed_type: award.allowed_type }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setMessage({ type: "success", text: "Changes saved successfully!" });
    } catch (error) {
      console.error("Error saving:", error);
      setMessage({ type: "error", text: "Failed to save changes" });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0f1117]">
        <AdminSidebar />
        <main className="flex-1 bg-[#0f1117] overflow-y-auto flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f1117]">
      <AdminSidebar />
      <main className="flex-1 bg-[#0f1117] overflow-y-auto">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Awards Settings</h1>
          <p className="text-gray-400 mb-8">
            Configure whether each award accepts Journal or Book publications.
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {awards.map((award) => (
              <div key={award.award_id} className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-1">{award.title}</h2>
                {award.description && (
                  <p className="text-gray-400 text-sm mb-4">{award.description}</p>
                )}
                <div className="flex gap-4 mb-4">
                  {(['JOURNAL', 'BOOK'] as const).map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`award-${award.award_id}`}
                        value={type}
                        checked={award.allowed_type === type}
                        onChange={() => handleTypeChange(award.award_id, type)}
                        className="accent-blue-500"
                      />
                      <span className="text-gray-300">{type === 'JOURNAL' ? 'Journal' : 'Book'}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => handleSave(award.award_id)}
                  disabled={saving === award.award_id}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  {saving === award.award_id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
