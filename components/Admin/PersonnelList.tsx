"use client";

import { useState, useEffect, useCallback } from "react";

interface PersonnelData {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  position: string | null;
  department: string | null;
  role: string;
  awardApplications: number;
  publications: number;
}

interface PersonnelListProps {
  role: "teaching" | "nonteaching";
}

export default function PersonnelList({ role }: PersonnelListProps) {
  const [personnel, setPersonnel] = useState<PersonnelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: PersonnelData | null }>({
    open: false,
    user: null,
  });
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const response = await fetch(`/api/admin/get-personnel/route?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch personnel");
      }
      const data = await response.json();
      setPersonnel(data);
    } catch (error) {
      console.error("Error fetching personnel:", error);
    } finally {
      setLoading(false);
    }
  }, [role, debouncedSearch]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const getFullName = (person: PersonnelData) => {
    const parts = [
      person.first_name,
      person.middle_name,
      person.last_name
    ].filter(Boolean);
    return parts.join(" ") || "N/A";
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const response = await fetch("/api/admin/update-user-role/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to update role");
        return;
      }

      alert("Role updated successfully");
      fetchPersonnel();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDeleteClick = (user: PersonnelData) => {
    setDeleteModal({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;

    setDeletingUser(deleteModal.user.id);
    setDeleteModal({ open: false, user: null });

    try {
      const response = await fetch("/api/admin/delete-user/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteModal.user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to delete user");
        return;
      }

      alert("User deleted successfully");
      fetchPersonnel();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ open: false, user: null });
  };

  const title = role === "teaching" ? "Teaching Personnel" : "Non-Teaching Personnel";
  const otherRole = role === "teaching" ? "nonteaching" : "teaching";

  return (
    <div className="flex-1 overflow-auto bg-[#0f1117] text-gray-300 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400">
            {role === "teaching"
              ? "View and search teaching personnel"
              : "View and search non-teaching personnel"}
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, position, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 bg-[#1b1e2b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : personnel.length === 0 ? (
          <div className="bg-[#1b1e2b] rounded-lg p-8 border border-gray-700 text-center">
            <p className="text-gray-400">
              {debouncedSearch
                ? "No personnel found matching your search."
                : "No personnel found."}
            </p>
          </div>
        ) : (
          <div className="bg-[#1b1e2b] rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#252836]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Signed Applications
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total Publications
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {personnel.map((person) => (
                    <tr key={person.id} className="hover:bg-[#2d3142] transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-medium">
                          {getFullName(person)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-300">
                          {person.email || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-300">
                          {person.position || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-300">
                          {person.department || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900 text-blue-200">
                          {person.awardApplications}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-200">
                          {person.publications}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value={person.role}
                            onChange={(e) => handleRoleChange(person.id, e.target.value)}
                            disabled={updatingRole === person.id}
                            className="px-2 py-1 bg-[#1b1e2b] border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="teaching">Teaching</option>
                            <option value="nonteaching">Non-Teaching</option>
                          </select>
                          <button
                            onClick={() => handleDeleteClick(person)}
                            disabled={deletingUser === person.id}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete user"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && personnel.length > 0 && (
          <div className="mt-4 text-sm text-gray-400">
            Showing {personnel.length} personnel
          </div>
        )}
      </div>

      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1b1e2b] border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete the account for{" "}
              <span className="font-semibold text-white">{getFullName(deleteModal.user)}</span>?
            </p>
            <p className="text-red-400 text-sm mb-6">
              Warning: This will also delete all their submissions and publications. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-400 text-gray-800 border rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}