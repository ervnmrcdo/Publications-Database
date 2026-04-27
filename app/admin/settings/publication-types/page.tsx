"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";

interface PublicationType {
  id: number;
  name: string;
}

export default function Page() {
  const [types, setTypes] = useState<PublicationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingType, setEditingType] = useState<PublicationType | null>(null);
  const [deletingType, setDeletingType] = useState<PublicationType | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});
  const [settingsMessages, setSettingsMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  useEffect(() => {
    fetchTypes();
    fetchSettings();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/admin/publication-types/route");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/route");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data: { key: string; value: string }[] = await response.json();
      setSettings(data);
      setEditingSettings(Object.fromEntries(data.map(s => [s.key, s.value])));
    } catch (error) {
      console.error("Error fetching settings:", error);
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

  const openAddDialog = () => {
    setEditingType(null);
    setName("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: PublicationType) => {
    setEditingType(type);
    setName(type.name);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (type: PublicationType) => {
    setDeletingType(type);
    setIsConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      const method = editingType ? "PUT" : "POST";
      const body = editingType
        ? { id: editingType.id, name: name.trim() }
        : { name: name.trim() };

      // const response = await fetch("/api/admin/publication-types/route");
      const response = await fetch("/api/admin/publication-types/route", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save");

      setIsDialogOpen(false);
      setMessage({ type: "success", text: "Saved successfully!" });
      fetchTypes();
    } catch (error) {
      console.error("Error saving:", error);
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingType) return;

    try {
      const response = await fetch(
        `/api/admin/publication-types/route?id=${deletingType.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setIsConfirmOpen(false);
      setDeletingType(null);
      setMessage({ type: "success", text: "Deleted successfully!" });
      fetchTypes();
    } catch (error) {
      console.error("Error deleting:", error);
      setMessage({ type: "error", text: "Failed to delete" });
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Publication Types</h1>
              <p className="text-gray-400 mt-1">
                Manage publication types for awards
              </p>
            </div>
            <button
              onClick={openAddDialog}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Add New
            </button>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${message.type === "success"
                ? "bg-green-600/20 text-green-400"
                : "bg-red-600/20 text-red-400"
                }`}
            >
              {message.text}
            </div>
          )}

          <div className="bg-[#1b1e2b] rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">
                    Name
                  </th>
                  <th className="text-right text-gray-400 font-medium px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {types.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="text-center text-gray-500 px-6 py-8"
                    >
                      No publication types found
                    </td>
                  </tr>
                ) : (
                  types.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-800/30">
                      <td className="text-white px-6 py-4">{type.name}</td>
                      <td className="text-right px-6 py-4">
                        <button
                          onClick={() => openEditDialog(type)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(type)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 pt-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Form Settings</h1>
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

        {isDialogOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1b1e2b] rounded-lg p-6 w-full max-w-md border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                {editingType ? "Edit Publication Type" : "Add Publication Type"}
              </h2>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 mb-6 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isConfirmOpen && deletingType && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1b1e2b] rounded-lg p-6 w-full max-w-md border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-2">
                Confirm Delete
              </h2>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete "{deletingType.name}"? This
                action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setDeletingType(null);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
