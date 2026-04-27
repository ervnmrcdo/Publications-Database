"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});
  const [settingsMessages, setSettingsMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/route");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data: { key: string; value: string }[] = await response.json();
      setSettings(data);
      setEditingSettings(Object.fromEntries(data.map(s => [s.key, s.value])));
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (key: string) => {
    setSavingSettings(prev => ({ ...prev, [key]: true }));
    setSettingsMessages(prev => ({ ...prev, [key]: undefined as any }));
    try {
      const response = await fetch("/api/admin/settings/route", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editingSettings[key] ?? '' }),
      });
      if (!response.ok) throw new Error("Failed to save");
      setSettingsMessages(prev => ({ ...prev, [key]: { type: 'success', text: 'Saved!' } }));
      fetchSettings();
    } catch {
      setSettingsMessages(prev => ({ ...prev, [key]: { type: 'error', text: 'Failed to save.' } }));
    } finally {
      setSavingSettings(prev => ({ ...prev, [key]: false }));
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Configure values that appear on autofilled forms</p>
          </div>
          <div className="bg-[#1b1e2b] rounded-lg border border-gray-700 divide-y divide-gray-700">
            {settings.length === 0 ? (
              <p className="text-gray-500 px-6 py-8 text-center">No settings found</p>
            ) : (
              settings.map(({ key }) => (
                <div key={key} className="px-6 py-5">
                  <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={editingSettings[key] ?? ''}
                      onChange={e => setEditingSettings(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                      className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSaveSetting(key)}
                      disabled={savingSettings[key]}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      {savingSettings[key] ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {settingsMessages[key] && (
                    <p className={`mt-2 text-sm ${settingsMessages[key].type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {settingsMessages[key].text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
