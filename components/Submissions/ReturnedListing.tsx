import { useAuth } from "@/context/AuthContext";
import { RejectedForm } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
    onSelect: (data: RejectedForm) => void;
}

export default function ReturnedListing({ onSelect }: Props) {


    const [returnedData, setReturnedData] = useState<RejectedForm[]>([])
    const { user } = useAuth()

    const payload = {
        id: user?.id,
    }

    useEffect(() => {
        if (!user?.id) return;
        fetch("/api/get/returned-forms", {
            method: 'POST',
            body: JSON.stringify(payload)
        }).then((res) => res.json()).then((result) => {
            const list = Array.isArray(result) ? result : [];
            setReturnedData(list.map((item: any) => ({
                submission_id: item.submission_id,
                publication_id: item.publication_id,
                first_name: item.authors?.first_name,
                last_name: item.authors?.last_name,
                date_submitted: item.date_submitted,
                award_title: item.awards?.title,
                publication_title: item.publication_title,
                tagged_authors: item.tagged_authors,
                award_id: item.awards?.award_id,
                remarks: item.remarks,
                logs: item.logs,
                form41_url: item.form41_url,
                form42_url: item.form42_url,
                form43_url: item.form43_url,
                form44_url: item.form44_url,
                journal_attachments: item.journal_attachments ?? {},
                book_attachments: item.book_attachments ?? {}, 
                isReturned: true,
            })))
        })
    }, [user?.id])

    console.log(returnedData)

    return (<div>
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 mt-5">
            <h1 className="text-2xl font-bold mb-6 text-white">Returned</h1>


            <div className="space-y-4">
                {returnedData.map((item) => (
                    <div
                        key={item.submission_id}
                        className="p-4 rounded-lg bg-[#252836] hover:bg-gray-600 cursor-pointer flex justify-between items-center transition"
                        onClick={() => { onSelect(item) }}
                    >
                        <div>
                            <p className="font-semibold text-lg text-white">{item.publication_title}</p>
                            <p className="text-sm text-gray-300">Applicant: {item.first_name} {item.last_name}</p>
                            <p className="text-sm text-gray-300">{item.award_title}</p>
                            <p className="text-xs text-red-400">{(item.remarks) ? ` ${item.remarks}` : ''}</p>
                        </div>
                        <ChevronRight className="text-gray-400" />
                    </div>
                ))}
            </div>
        </div>


    </div>);
}
