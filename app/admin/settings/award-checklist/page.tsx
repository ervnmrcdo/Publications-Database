"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";

interface ChecklistItem {
  id: number;
  award_type: 'JOURNAL' | 'BOOK';
  item: string;
  sort_order: number;
  is_active: boolean;
}

type AwardType = 'JOURNAL' | 'BOOK';

export default function Page() {
  const [activeTab, setActiveTab] = useState<AwardType>('JOURNAL');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchItems = async (type: AwardType) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/award-checklist/route?type=${type}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(activeTab);
  }, [activeTab]);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/award-checklist/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ award_type: activeTab, item: newItem.trim() }),
      });
      if (res.ok) {
        setNewItem('');
        await fetchItems(activeTab);
        setMessage({ type: 'success', text: 'Item added' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to add item' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add item' });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/award-checklist/route?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchItems(activeTab);
        setMessage({ type: 'success', text: 'Item removed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove item' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="flex h-screen bg-[#0f1117]">
      <AdminSidebar />
      <main className="flex-1 bg-[#0f1117] overflow-y-auto">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Award Checklist Settings</h1>
          <p className="text-gray-400 mb-8">
            Configure which documents appear on the applicant&apos;s supporting documents checklist.
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
              {message.text}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6">
            {(['JOURNAL', 'BOOK'] as const).map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-6 py-2 rounded-t-lg text-sm font-medium transition ${
                  activeTab === type
                    ? 'bg-[#1b1e2b] text-white border-b-2 border-blue-500'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {type === 'JOURNAL' ? 'Journal Articles' : 'Books / Book Chapters'}
              </button>
            ))}
          </div>

          {/* Checklist Items */}
          <div className="bg-[#1b1e2b] rounded-lg p-6 border border-gray-700">
            {loading ? (
              <div className="text-gray-400 py-8 text-center">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-gray-500 py-8 text-center">
                No checklist items yet. Add one below.
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                      <span className="text-gray-200 text-sm">{item.item}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/30 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new item */}
            <div className="border-t border-gray-700 pt-4">
              <label className="block text-sm text-gray-300 mb-2">Add New Item</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Copy of the Journal Article"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAdd}
                  disabled={adding || !newItem.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
