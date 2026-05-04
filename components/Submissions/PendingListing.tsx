import { useAuth } from "@/context/AuthContext";
import { PendingForm } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
    onSelect: (data: PendingForm) => void;
}

export default function PendingListing({ onSelect }: Props) {
    const [pendingData, setPendingData] = useState<PendingForm[]>([]);
    const { user, profile } = useAuth();

    useEffect(() => {
        if (!user || !profile) return;

        const fetchPendingAwards = async () => {
            try {
                let response;
                if (profile.role === "admin") {
                    response = await fetch("/api/pendingAwards");
                } else if (profile.role === "nonteaching" || profile.role === "teaching") {
                    response = await fetch("/api/pendingAwards", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: user.id })
                    });
                } else {
                    setPendingData([]);
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    const list = Array.isArray(data) ? data : [];
                    const formatted = list.map((item: any) => ({
                        submission_id: item.id,
                        name: item.name,
                        first_name: item.name.split(' ')[0],
                        last_name: item.name.split(' ').slice(1).join(' '),
                        publicationTitle: item.publicationTitle,
                        date_submitted: item.dateSubmitted,
                        award_title: item.awardTitle,
                        status: item.status,
                        logs: item.logs || [],
                        form41Url: item.form41Url || null,
                        form42Url: item.form42Url || null,
                        form43Url: item.form43Url || null,
                        form44Url: item.form44Url || null,
                        journal_attachments: item.journal_attachments || {},
                        book_attachments: item.book_attachments || {},
                    }));
                    setPendingData(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch pending awards:", error);
            }
        };

        fetchPendingAwards();
    }, [user, profile]);

    return (
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 mt-5">
            <h1 className="text-2xl font-bold mb-6 text-white">Pending</h1>

            <div className="space-y-4">
                {pendingData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No pending awards at this time.</p>
                ) : (
                    pendingData.map((item) => (
                        <div
                            key={item.submission_id}
                            className="p-4 rounded-lg bg-[#252836] hover:bg-gray-600 cursor-pointer flex justify-between items-center transition"
                            onClick={() => { onSelect(item) }}
                        >
                            <div>
                                <p className="font-bold text-lg text-white">{item.publicationTitle || 'Untitled Publication'}</p>
                                <p className="text-sm text-gray-300">{item.name} &middot; {item.award_title}</p>
                                <p className="text-xs text-gray-400">{new Date(item.date_submitted).toLocaleString()}</p>
                            </div>
                            <ChevronRight className="text-gray-400" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}