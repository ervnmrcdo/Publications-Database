import { AcceptedForm } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
    adminId: string;
    onSelect: (data: AcceptedForm) => void;
}

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
                            <div>
                                <p className="font-semibold text-lg text-white">{item.first_name + ' ' + item.last_name}</p>
                                <p className="text-sm text-gray-300">{item.award_title}</p>
                                <p className="text-xs text-gray-400">{item.date_submitted}</p>
                            </div>
                            <ChevronRight className="text-gray-400" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
