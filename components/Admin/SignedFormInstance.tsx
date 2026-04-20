import { AcceptedForm } from "@/lib/types"
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

const STATUS_LABELS: Record<string, string> = {
  'VALIDATED': 'Validated',
  'PENDING_SUBMISSION': 'Pending Submission',
  'SUBMITTED': 'Submitted to Higher Offices',
  'PROCESSED': 'Processed',
};

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

type Props = {
    data: AcceptedForm;
    onBack: () => void;
}

export default function SignedFormInstance({ data, onBack }: Props) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>();

    async function download() {
        if (!data.pdfBufferData) return;
        const a = document.createElement("a");
        a.href = data.pdfBufferData;
        a.download = "signed-ipc-award-form.pdf";
        a.click();
    }

    useEffect(() => {
        if (data) {
            setPdfUrl(data.pdfBufferData ?? null);
        }
    }, [data])

    return (
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 space-y-4">
            <button
                onClick={onBack}
                className="flex items-center text-gray-400 hover:text-white mb-2"
            >
                <ArrowLeft className="mr-2" /> Back
            </button>

            <div className="p-4 bg-[#252836] rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg text-white">{data.first_name + ' ' + data.last_name}</p>
                        <p className="text-sm text-gray-300">{data.award_title}</p>
                        <p className="text-xs text-gray-400">{data.date_submitted}</p>
                    </div>
                    {data.status && (
                        <div className="flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-gray-500" />
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-900/50 text-gray-300">
                                {STATUS_LABELS[data.status] || data.status}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition" onClick={download}>
                    Download for Printing
                </button>
            </div>
            {
                pdfUrl ? (
                    <div className="border rounded-lg p-4 max-h-[70vh] overflow-y-scroll bg-[#1a1e2b]">
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        >
                            {Array.from(new Array(numPages), (_, i) => (
                                <Page
                                    key={i}
                                    pageNumber={i + 1}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="mb-4 shadow"
                                />
                            ))}
                        </Document>
                    </div>
                ) : (
                    <p>No PDF attached.</p>
                )
            }
        </div>
    )
}
