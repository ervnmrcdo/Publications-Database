import { AcceptedForm } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
    adminId: string;
    onSelect: (data: AcceptedForm) => void;
}

const STATUS_OPTIONS = [
    { value: 'VALIDATED', label: 'Validated', color: 'bg-green-900/30 text-green-400' },
    { value: 'PENDING_SUBMISSION', label: 'Pending Submission', color: 'bg-blue-900/30 text-blue-400' },
    { value: 'SUBMITTED', label: 'Submitted', color: 'bg-purple-900/30 text-purple-400' },
    { value: 'PROCESSED', label: 'Processed', color: 'bg-gray-900/30 text-gray-400' },
];

const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option?.color || 'bg-gray-900/30 text-gray-400';
};

const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option?.label || status;
};

export default function SignedFormsListing({ adminId, onSelect }: Props) {
    const [signedData, setSignedData] = useState<AcceptedForm[]>([])

    useEffect(() => {
        if (!adminId) return;

        fetch("/api/admin/get-signed-forms/route", {
            method: 'POST',
            body: JSON.stringify({ adminId })
        }).then((res) => res.json()).then((result) => {
            setSignedData(result.map((item: any) => ({
                submission_id: item.submission_id,
                pdfBufferData: item.pdfUrl || item.attached_files,
                first_name: item.first_name,
                last_name: item.last_name,
                date_submitted: item.date_submitted,
                award_title: item.title,
                publication_title: item.publication_title,
                logs: item.logs,
                status: item.status,
                form41Url: item.form41Url,
                form42Url: item.form42Url,
                form43Url: item.form43Url,
                form44Url: item.form44Url,
            })))
        })
    }, [adminId])

    return (
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-white">My Signed Forms</h2>

            {signedData.length === 0 ? (
                <p className="text-gray-400">No signed forms yet.</p>
            ) : (
                <div className="space-y-4">
                    {signedData.map((item) => (
                        <div
                            key={item.submission_id}
                            className="p-4 rounded-lg bg-[#252836] hover:bg-gray-600 cursor-pointer flex justify-between items-center transition"
                            onClick={() => { onSelect(item) }}
                        >
                            <div className="flex-1">
                                <p className="font-bold text-lg text-white">{item.publication_title || 'Untitled Publication'}</p>
                                <p className="text-sm text-gray-300">{item.first_name + ' ' + item.last_name} &middot; {item.award_title}</p>
                                <p className="text-xs text-gray-400">{new Date(item.date_submitted).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {item.status && (
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                        {getStatusLabel(item.status)}
                                    </span>
                                )}
                                <ChevronRight className="text-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}