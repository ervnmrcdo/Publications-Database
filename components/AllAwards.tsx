import { useState, useEffect } from "react";

interface Award {
    id: number;
    name: string;
    submitterType: string;
    dateSubmitted: string;
    status: string;
    awardId: number;
    awardTitle: string;
}


export default function AllAwards() {

    const [pendingAwards, setPendingAwards] = useState<Award[]>([]);
    const [isLoadingPending, setIsLoadingPending] = useState(true);

    useEffect(() => {
        const fetchPendingAwards = async () => {
            try {
                const response = await fetch("/api/admin/get-all-awards/route");
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
    }, []);

    return (
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 mt-5">

            {/* Pending Awards Table */}
            <div className="p-6 mt-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-200">
                    All Forms
                </h2>
                {isLoadingPending ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
                    </div>
                ) : pendingAwards.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        Database doesn't contain past awards.
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
                                    <tr key={award.id} className="hover:bg-gray-700 transition-colors">
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
                                            {award.status === 'VALIDATED' && (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400">
                                                    Validated
                                                </span>
                                            )}
                                            {award.status === 'PENDING' && (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/30 text-yellow-400">
                                                    Pending
                                                </span>
                                            )}
                                            {award.status === 'RETURNED' && (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900/30 text-red-400">
                                                    Returned
                                                </span>
                                            )}
                                            {award.status === 'PENDING_SUBMISSION' && (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/30 text-blue-400">
                                                    Pending Submission
                                                </span>
                                            )}
                                            {award.status === 'SUBMITTED' && (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-900/30 text-purple-400">
                                                    Submitted
                                                </span>
                                            )}
                                            {award.status === 'PROCESSED' && (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-900/30 text-gray-400">
                                                    Processed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    )
}
