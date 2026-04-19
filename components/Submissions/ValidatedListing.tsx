import { useAuth } from "@/context/AuthContext";
import { AcceptedForm } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
    onSelect: (data: AcceptedForm) => void;
}

export default function AcceptedListing({ onSelect }: Props) {

    const [step, setStep] = useState<'listing' | 'accepted-review'>('listing')
    // should store selected data to be viewed later
    const [acceptedAward, setAcceptedAward] = useState<AcceptedForm | null>(null)
    // stores retrieved data
    const [acceptedData, setAcceptedData] = useState<AcceptedForm[]>([])
    // const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const { user } = useAuth()


    const payload = {
        id: user?.id,
        submitterType: 'NONTEACHING'
    }

    useEffect(() => {
        if (!user?.id) return;
        fetch("/api/get/accepted-forms", {
            method: 'POST',
            body: JSON.stringify(payload)
        }).then((res) => res.json()).then((result) => {
            console.log(result)
            const list = Array.isArray(result) ? result : [];
            setAcceptedData(result.map((item: any) => ({
                submission_id: item.submission_id,
                // NEW: Use pdfUrl from Supabase Storage instead of attached_files
                pdfBufferData: item.pdfUrl || item.attached_files,
                first_name: item.first_name,
                last_name: item.last_name,
                date_submitted: item.date_submitted,
                award_title: item.award_title,
                logs: item.logs,
                form41_url: item.form41_path,
                form42_url: item.form42_path,
                form43_url: item.form43_path,
                form44_url: item.form44_path,
                journal_attachments: item.journal_attachments ?? {},
                book_attachments: item.book_attachments ?? {}, 
            })))
        })
    }, [user?.id])

    return (<div>
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 mt-5">
            <h1 className="text-2xl font-bold mb-6 text-white">Validated</h1>


            <div className="space-y-4">
                {acceptedData.map((item) => (
                    <div
                        key={item.submission_id}
                        className="p-4 rounded-lg bg-[#252836] hover:bg-gray-600 cursor-pointer flex justify-between items-center transition"
                        onClick={() => { onSelect(item) }}
                    >
                        <div>
                            <p className="font-semibold text-lg text-white">{item.first_name + ' ' + item.last_name}</p>
                            <p className="text-sm text-gray-300">{item.award_title}</p>
                            <p className="text-xs text-gray-400">{new Date(item.date_submitted).toLocaleString()}</p>
                        </div>
                        <ChevronRight className="text-gray-400" />
                    </div>
                ))}
            </div>
        </div>
    </div>);
}
