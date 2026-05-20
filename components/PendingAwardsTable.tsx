import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface PendingAward {
    id: number;
    name: string;
    submitterType: string;
    dateSubmitted: string;
    status: string;
    awardId: number;
    awardTitle: string;
}


export default function PendingAwardsTable() {

    const [pendingAwards, setPendingAwards] = useState<PendingAward[]>([]);
    const [isLoadingPending, setIsLoadingPending] = useState(true);
    const { user, profile } = useAuth();

    const [selectedAward, setSelectedAward] = useState<PendingAward | null>(null);

    useEffect(() => {
        setPendingAwards([])
        setSelectedAward(null)
        setIsLoadingPending(true)

        if (!user || !profile) {
            setIsLoadingPending(false)
            return
        }
        const fetchPendingAwards = async () => {
            try {
                let response;
                // Only admins see all, others see their own
                if (profile.role === "admin") {
                    response = await fetch("/api/pendingAwards");
                } else if (profile.role === "nonteaching" || profile.role === "teaching") {
                    response = await fetch("/api/pendingAwards", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: user.id })
                    });
                } else {
                    setPendingAwards([]);
                    setIsLoadingPending(false);
                    return;
                }
                if (response.ok) {
                    const data = await response.json();
                    setPendingAwards(data);
                }
            } catch (error) {
                console.error("Failed to fetch pending awards:", error);
            } finally {
                setIsLoadingPending(false);
            }
        };
        fetchPendingAwards();
    }, [user?.id, profile?.role]);

    return (
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 mt-5">

            {/* Pending Awards Table */}
            <div className="p-6 mt-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-200">
                    Pending Awards
                </h2>
                {isLoadingPending ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
                    </div>
                ) : pendingAwards.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No pending awards at this time.
                    </div>
                ) : (
                    <div className="overflow-x-auto shadow-md rounded-lg">
                        <table className="min-w-full bg-[#1b1e2b] border border-gray-700">
                            <thead className="bg-[#252836]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">
                                        Submission ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">
                                        Applicant Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">
                                        Award Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">
                                        Submitter Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">
                                        Date Submitted
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pendingAwards.map((award) => (
                                    <tr key={award.id} className="hover:bg-gray-700 transition-colors cursor-pointer"
                                        onClick={() => setSelectedAward(award)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            #{award.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {award.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {award.awardTitle}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {award.submitterType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(award.dateSubmitted).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/30 text-yellow-400">
                                                {award.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedAward && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-[#1b1e2b] p-6 rounded-lg w-full max-w-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">
                    Submission #{selectedAward.id}
                </h3>

                <div className="space-y-2 text-gray-300 text-sm">
                    <p><span className="text-gray-400">Applicant:</span> {selectedAward.name}</p>
                    <p><span className="text-gray-400">Award Title:</span> {selectedAward.awardTitle}</p>
                    <p><span className="text-gray-400">Submitter Type:</span> {selectedAward.submitterType}</p>
                    <p><span className="text-gray-400">Date Submitted:</span> {new Date(selectedAward.dateSubmitted).toLocaleString()}</p>
                    <p><span className="text-gray-400">Status:</span> {selectedAward.status}</p>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                    onClick={() => setSelectedAward(null)}
                    className="bg-gray-400 hover:bg-gray-500 text-gray-800 px-4 py-2 rounded border"
                    >
                    Close
                    </button>
                </div>
                </div>
            </div>
            )}
        </div>
        
    )
}
