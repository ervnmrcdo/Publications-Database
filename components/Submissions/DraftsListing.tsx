import { useAuth } from "@/context/AuthContext";
import { DraftForm } from "@/lib/types";
import { ChevronRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
    onSelect: (data: DraftForm) => void;
}

export default function DraftsListing({ onSelect }: Props) {
    const [draftsData, setDraftsData] = useState<DraftForm[]>([])
    const { user } = useAuth()
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ submissionId: number; publicationId: number; awardId: number } | null>(null);

    const payload = {
        id: user?.id,
    }

    const refreshDrafts = () => {
        fetch("/api/get/drafts", {
            method: 'POST',
            body: JSON.stringify(payload),
        }).then((res) => res.json()).then((result) => {
            setDraftsData(result.map((item: any) => ({
                submission_id: item.submission_id,
                publication_id: item.publication_id,
                first_name: item.authors?.first_name,
                last_name: item.authors?.last_name,
                date_submitted: item.date_submitted,
                award_title: item.awards?.title,
                publication_title: item.publication_title,
                tagged_authors: item.tagged_authors,
                award_id: item.awards?.award_id,
                logs: item.logs,
                form41_url: item.form41_url,
                form42_url: item.form42_url,
                form43_url: item.form43_url,
                form44_url: item.form44_url,
                status: item.status,
                journal_attachments: item.journal_attachments || {},
                book_attachments: item.book_attachments || {},
            })))
        })
    }

    useEffect(() => {
        refreshDrafts()
    }, [])

    const handleDelete = async (deleteInfo: { submissionId: number; publicationId: number; awardId: number }) => {
        setDeletingId(deleteInfo.submissionId);
        try {
            const response = await fetch('/api/delete-draft/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission_id: deleteInfo.submissionId,
                    publicationId: deleteInfo.publicationId,
                    awardId: deleteInfo.awardId,
                }),
            });

            if (response.ok) {
                setShowDeleteConfirm(null);
                refreshDrafts();
            } else {
                const result = await response.json();
                alert('Failed to delete draft: ' + result.error);
            }
        } catch (err) {
            console.error('Error deleting draft:', err);
            alert('Failed to delete draft');
        } finally {
            setDeletingId(null);
        }
    };

    console.log(draftsData)
    return (<div>
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 mt-5">
            <h1 className="text-2xl font-bold mb-6 text-white">Drafts</h1>


            <div className="space-y-4">
                {draftsData.map((item) => (
                    <div
                        key={item.submission_id}
                        className="p-4 rounded-lg bg-[#252836] hover:bg-gray-600 cursor-pointer flex justify-between items-center transition"
                        onClick={() => { onSelect(item) }}
                    >
                        <div className="flex-1">
                            <p className="font-semibold text-lg text-white">{item.publication_title}</p>
                            <p className="text-sm text-gray-300">{item.award_title}</p>
                            <p className="text-xs text-gray-400">{(item.date_submitted) ? ` ${new Date(item.date_submitted).toLocaleDateString()}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm({
                                        submissionId: Number(item.submission_id),
                                        publicationId: Number(item.publication_id),
                                        awardId: Number(item.award_id),
                                    });
                                }}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition"
                                title="Delete draft"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <ChevronRight className="text-gray-400" />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4 text-white">Delete Draft</h3>
                    <p className="text-sm text-gray-300 mb-6">
                        Are you sure you want to delete this draft? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            className="px-4 py-2 border rounded-md hover:bg-gray-700"
                            onClick={() => setShowDeleteConfirm(null)}
                            disabled={deletingId !== null}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            onClick={() => handleDelete(showDeleteConfirm!)}
                            disabled={deletingId !== null}
                        >
                            {deletingId !== null ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}


    </div>);
}
