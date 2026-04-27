import { AcceptedForm, AttachmentData } from "@/lib/types"
import { ArrowLeft, ChevronDown, ChevronRight, Link, Edit2, Save, X, RotateCcw } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import * as jose from 'jose';
import { DocumentEditor } from "@onlyoffice/document-editor-react";

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

type Props = {
    data: AcceptedForm;
    onBack: () => void;
}

interface DocumentConfig {
    document: {
        fileType: string;
        key: string;
        title: string;
        url: string;
    };
    documentType: string;
    editorConfig: {
        mode: string;
        customization: {
            forcesave: boolean;
            autosave: boolean;
        };
    };
}

export default function AcceptedFormInstance({ data, onBack }: Props) {
    const [docxConfigs, setDocxConfigs] = useState<{
        form42?: { config: DocumentConfig; token: string };
        form43?: { config: DocumentConfig; token: string };
    }>({});
    const [pdfConfigs, setPdfConfigs] = useState<{
        form41?: { config: DocumentConfig; token: string };
        form44?: { config: DocumentConfig; token: string };
    }>({});

    const [loadingForm41, setLoadingForm41] = useState<boolean>(false);
    const [loadingForm42, setLoadingForm42] = useState<boolean>(false);
    const [loadingForm43, setLoadingForm43] = useState<boolean>(false);
    const [loadingForm44, setLoadingForm44] = useState<boolean>(false);

    const [expandedForm41, setExpandedForm41] = useState<boolean>(false);
    const [expandedForm42, setExpandedForm42] = useState<boolean>(false);
    const [expandedForm43, setExpandedForm43] = useState<boolean>(false);
    const [expandedForm44, setExpandedForm44] = useState<boolean>(false);

    const [status, setStatus] = useState<string>(data.status || 'VALIDATED');
    const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

    const [isEditingAttachments, setIsEditingAttachments] = useState<boolean>(false);
    const [journalAttachments, setJournalAttachments] = useState<AttachmentData>(
        { drive_url: data.journal_attachments?.drive_url ?? '', checklist: data.journal_attachments?.checklist ?? [] }
    );
    const [bookAttachments, setBookAttachments] = useState<AttachmentData>(
        { drive_url: data.book_attachments?.drive_url ?? '', checklist: data.book_attachments?.checklist ?? [] }
    );
    const [savingAttachments, setSavingAttachments] = useState<boolean>(false);

    const detectedIp = useMemo(() => typeof window !== 'undefined' ? window.location.hostname : '', [])

    const generateToken = useCallback(async (config: DocumentConfig) => {
        const secret = new TextEncoder().encode('my_super_secret_key');
        return await new jose.SignJWT(config as unknown as jose.JWTPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret);
    }, []);

    const handleSaveAttachments = async () => {
        try {
            setSavingAttachments(true);
            
            const payload = {
                submission_id: data.submission_id,
                journal_attachments: journalAttachments,
                book_attachments: bookAttachments,
            };

            const response = await fetch('/api/update-attachments/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setIsEditingAttachments(false);
                alert('Attachments saved successfully');
            } else {
                const result = await response.json();
                alert('Failed to save attachments: ' + result.error);
            }
        } catch (err) {
            console.error('Error saving attachments:', err);
            alert('Failed to save attachments');
        } finally {
            setSavingAttachments(false);
        }
    };

    const generateForm41Config = useCallback(async () => {
        if (!data.submission_id) return;
        setLoadingForm41(true);
        try {
            const baseUrl = `http://host.docker.internal:3000`;
            const documentUrl = `${baseUrl}/api/admin/get-validated-form/route?submission_id=${data.submission_id}&form_type=41`;
            const config: DocumentConfig = {
                document: {
                    fileType: "pdf",
                    key: crypto.randomUUID(),
                    title: "4.1",
                    url: documentUrl,
                },
                documentType: "pdf",
                editorConfig: {
                    mode: "view",
                    customization: {
                        forcesave: false,
                        autosave: false,
                    },
                },
            };
            const token = await generateToken(config);
            setPdfConfigs(prev => ({ ...prev, form41: { config, token } }));
        } catch (err) {
            console.error('Error loading form 4.1:', err);
        } finally {
            setLoadingForm41(false);
        }
    }, [data.submission_id, generateToken]);

    const generateForm44Config = useCallback(async () => {
        if (!data.submission_id) return;
        setLoadingForm44(true);
        try {
            const baseUrl = `http://host.docker.internal:3000`;
            const documentUrl = `${baseUrl}/api/admin/get-validated-form/route?submission_id=${data.submission_id}&form_type=44`;
            const config: DocumentConfig = {
                document: {
                    fileType: "pdf",
                    key: crypto.randomUUID(),
                    title: "4.4",
                    url: documentUrl,
                },
                documentType: "pdf",
                editorConfig: {
                    mode: "view",
                    customization: {
                        forcesave: false,
                        autosave: false,
                    },
                },
            };
            const token = await generateToken(config);
            setPdfConfigs(prev => ({ ...prev, form44: { config, token } }));
        } catch (err) {
            console.error('Error loading form 4.4:', err);
        } finally {
            setLoadingForm44(false);
        }
    }, [data.submission_id, generateToken]);

    const generateForm42Config = useCallback(async () => {
        if (!data.submission_id) return;
        setLoadingForm42(true);
        try {
            const baseUrl = `http://host.docker.internal:3000`;
            const documentUrl = `${baseUrl}/api/admin/get-validated-form/route?submission_id=${data.submission_id}&form_type=42`;
            const config: DocumentConfig = {
                document: {
                    fileType: "docx",
                    key: crypto.randomUUID(),
                    title: "4.2",
                    url: documentUrl,
                },
                documentType: "word",
                editorConfig: {
                    mode: "view",
                    customization: {
                        forcesave: false,
                        autosave: false,
                    },
                },
            };
            const token = await generateToken(config);
            setDocxConfigs(prev => ({ ...prev, form42: { config, token } }));
        } catch (err) {
            console.error('Error loading form 4.2:', err);
        } finally {
            setLoadingForm42(false);
        }
    }, [data.submission_id, generateToken]);

    const generateForm43Config = useCallback(async () => {
        if (!data.submission_id) return;
        setLoadingForm43(true);
        try {
            const baseUrl = `http://host.docker.internal:3000`;
            const documentUrl = `${baseUrl}/api/admin/get-validated-form/route?submission_id=${data.submission_id}&form_type=43`;
            const config: DocumentConfig = {
                document: {
                    fileType: "pdf",
                    key: crypto.randomUUID(),
                    title: "4.3",
                    url: documentUrl,
                },
                documentType: "pdf",
                editorConfig: {
                    mode: "view",
                    customization: {
                        forcesave: false,
                        autosave: false,
                    },
                },
            };
            const token = await generateToken(config);
            setDocxConfigs(prev => ({ ...prev, form43: { config, token } }));
        } catch (err) {
            console.error('Error loading form 4.3:', err);
        } finally {
            setLoadingForm43(false);
        }
    }, [data.submission_id, generateToken]);

    const handleToggleForm41 = async () => {
        if (expandedForm41) {
            setPdfConfigs(prev => { const { form41, ...rest } = prev; return rest; });
        } else {
            await generateForm41Config();
        }
        setExpandedForm41(!expandedForm41);
    };

    const handleToggleForm44 = async () => {
        if (expandedForm44) {
            setPdfConfigs(prev => { const { form44, ...rest } = prev; return rest; });
        } else {
            await generateForm44Config();
        }
        setExpandedForm44(!expandedForm44);
    };

    const handleToggleForm42 = async () => {
        if (expandedForm42) {
            setDocxConfigs(prev => { const { form42, ...rest } = prev; return rest; });
        } else {
            await generateForm42Config();
        }
        setExpandedForm42(!expandedForm42);
    };

    const handleToggleForm43 = async () => {
        if (expandedForm43) {
            setDocxConfigs(prev => { const { form43, ...rest } = prev; return rest; });
        } else {
            await generateForm43Config();
        }
        setExpandedForm43(!expandedForm43);
    };

    const hasForm41 = !!data.form41_url;
    const hasForm42 = !!data.form42_url;
    const hasForm43 = !!data.form43_url;
    const hasForm44 = !!data.form44_url;

    const getEditorConfig = useCallback((config: DocumentConfig, token: string) => ({
        ...config,
        token: token,
    }), []);

    const handleStatusChange = async (newStatus: string) => {
        try {
            setUpdatingStatus(true);
            const response = await fetch('/api/update-status/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission_id: data.submission_id,
                    status: newStatus,
                }),
            });

            if (response.ok) {
                setStatus(newStatus);
                alert('Status updated successfully');
            } else {
                const result = await response.json();
                alert('Failed to update status: ' + result.error);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    return (

        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="mr-2" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-gray-400" />
                    <select
                        value={status}
                        onChange={(e) => {
                            if (e.target.value !== status && confirm('Change status to ' + getStatusLabel(e.target.value) + '?')) {
                                handleStatusChange(e.target.value);
                            }
                        }}
                        disabled={updatingStatus}
                        className={`px-3 py-1 rounded text-sm font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(status)}`}
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value} className={option.color}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-4 bg-[#252836] rounded-lg">
                <p className="font-bold text-lg text-white">{data.first_name + ' ' + data.last_name}</p>
                <p className="text-sm text-gray-300">{data.award_title}</p>
                <p className="text-xs text-gray-400">{new Date(data.date_submitted).toLocaleString()}</p>
            </div>

            {hasForm41 && (
                <div className="border rounded-lg overflow-hidden">
                    <button
                        onClick={handleToggleForm41}
                        className="w-full px-4 py-3 bg-[#252836] hover:bg-gray-700 flex justify-between items-center text-white"
                    >
                        <span>Form 4.1 - IPA Form (PDF)</span>
                        {expandedForm41 ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    {expandedForm41 && (
                        <div className="border rounded-lg p-4 h-[calc(100vh-40px)] bg-[#1a1e2b]">
                            {loadingForm41 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-gray-400">Loading document...</div>
                                </div>
                            ) : pdfConfigs.form41?.config && pdfConfigs.form41?.token ? (
                                <div style={{ height: '100%' }}>
                                    <DocumentEditor
                                        id="form41Viewer"
                                        documentServerUrl={`http://${detectedIp}:8080/`}
                                        config={getEditorConfig(pdfConfigs.form41.config, pdfConfigs.form41.token)}
                                    />
                                </div>
                            ) : (
                                <p className="text-gray-400">No document available.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {hasForm42 && (
                <div className="border rounded-lg overflow-hidden">
                    <button
                        onClick={handleToggleForm42}
                        className="w-full px-4 py-3 bg-[#252836] hover:bg-gray-700 flex justify-between items-center text-white"
                    >
                        <span>Form 4.2 - IPA Form (DOCX)</span>
                        {expandedForm42 ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    {expandedForm42 && (
                        <div className="border rounded-lg p-4 h-[calc(100vh-40px)] bg-[#1a1e2b]">
                            {loadingForm42 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-gray-400">Loading document...</div>
                                </div>
                            ) : docxConfigs.form42?.config && docxConfigs.form42?.token ? (
                                <div style={{ height: '100%' }}>
                                    <DocumentEditor
                                        id="form42Viewer"
                                        documentServerUrl={`http://${detectedIp}:8080/`}
                                        config={getEditorConfig(docxConfigs.form42.config, docxConfigs.form42.token)}
                                    />
                                </div>
                            ) : (
                                <p className="text-gray-400">No document available.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {hasForm43 && (
                <div className="border rounded-lg overflow-hidden">
                    <button
                        onClick={handleToggleForm43}
                        className="w-full px-4 py-3 bg-[#252836] hover:bg-gray-700 flex justify-between items-center text-white"
                    >
                        <span>Form 4.3 - IPA Form (DOCX)</span>
                        {expandedForm43 ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    {expandedForm43 && (
                        <div className="border rounded-lg p-4 h-[calc(100vh-40px)] bg-[#1a1e2b]">
                            {loadingForm43 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-gray-400">Loading document...</div>
                                </div>
                            ) : docxConfigs.form43?.config && docxConfigs.form43?.token ? (
                                <div style={{ height: '100%' }}>
                                    <DocumentEditor
                                        id="form43Viewer"
                                        documentServerUrl={`http://${detectedIp}:8080/`}
                                        config={getEditorConfig(docxConfigs.form43.config, docxConfigs.form43.token)}
                                    />
                                </div>
                            ) : (
                                <p className="text-gray-400">No document available.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {hasForm44 && (
                <div className="border rounded-lg overflow-hidden">
                    <button
                        onClick={handleToggleForm44}
                        className="w-full px-4 py-3 bg-[#252836] hover:bg-gray-700 flex justify-between items-center text-white"
                    >
                        <span>Form 4.4 - IPA Form (PDF)</span>
                        {expandedForm44 ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    {expandedForm44 && (
                        <div className="border rounded-lg p-4 h-[calc(100vh-40px)] bg-[#1a1e2b]">
                            {loadingForm44 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-gray-400">Loading document...</div>
                                </div>
                            ) : pdfConfigs.form44?.config && pdfConfigs.form44?.token ? (
                                <div style={{ height: '100%' }}>
                                    <DocumentEditor
                                        id="form44Viewer"
                                        documentServerUrl={`http://${detectedIp}:8080/`}
                                        config={getEditorConfig(pdfConfigs.form44.config, pdfConfigs.form44.token)}
                                    />
                                </div>
                            ) : (
                                <p className="text-gray-400">No document available.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
            {/* Attachments Section */}
{(() => {
    const isJournal = !!data.form41_url;
    const attachments = isJournal ? journalAttachments : bookAttachments;
    const setAttachments = isJournal ? setJournalAttachments : setBookAttachments;

    const JOURNAL_CHECKLIST = ['Copy of the Journal Article'];
    const BOOK_CHECKLIST = [
        'Copy of Book / Book Chapter',
        'Book Cover',
        'Copyright Page',
        'Preface',
        'Table of Contents',
        'List of Contributors or Contributors Notes',
        'Proof of Peer Review Process',
    ];
    const checklistItems = isJournal ? JOURNAL_CHECKLIST : BOOK_CHECKLIST;

    const toggleCheck = (item: string) => {
        setAttachments(prev => ({
            ...prev,
            checklist: (prev.checklist ?? []).includes(item)
                ? (prev.checklist ?? []).filter(i => i !== item)
                : [...(prev.checklist ?? []), item],
        }));
    };

    return (
        <div className="p-4 bg-[#252836] rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <p className="font-bold text-white">Supporting Documents</p>
                {!isEditingAttachments ? (
                    <button
                        onClick={() => setIsEditingAttachments(true)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setJournalAttachments({ drive_url: data.journal_attachments?.drive_url ?? '', checklist: data.journal_attachments?.checklist ?? [] });
                                setBookAttachments({ drive_url: data.book_attachments?.drive_url ?? '', checklist: data.book_attachments?.checklist ?? [] });
                                setIsEditingAttachments(false);
                            }}
                            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                            <X className="w-4 h-4 mr-1" /> Cancel
                        </button>
                        <button
                            onClick={handleSaveAttachments}
                            disabled={savingAttachments}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-1" /> {savingAttachments ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            {/* Drive URL */}
            <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-1">Google Drive Folder Link</label>
                {isEditingAttachments ? (
                    <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-3 py-2">
                        <Link className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                        <input
                            type="url"
                            value={attachments.drive_url}
                            onChange={e => setAttachments(prev => ({ ...prev, drive_url: e.target.value }))}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
                        />
                    </div>
                ) : attachments.drive_url ? (
                    <a
                        href={attachments.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm break-all"
                    >
                        {attachments.drive_url}
                    </a>
                ) : (
                    <span className="text-gray-500 text-sm">No link provided</span>
                )}
            </div>

            {/* Checklist */}
            <div>
                <label className="block text-sm text-gray-300 mb-2">Documents included in the folder</label>
                <div className="space-y-2">
                    {checklistItems.map(item => {
                        const checked = (attachments.checklist ?? []).includes(item);
                        return isEditingAttachments ? (
                            <label
                                key={item}
                                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCheck(item)}
                                    className="w-4 h-4 accent-blue-500"
                                />
                                <span className="text-sm text-gray-300">{item}</span>
                            </label>
                        ) : (
                            <div key={item} className="flex items-center gap-2 text-sm">
                                <span className={checked ? 'text-green-400' : 'text-gray-600'}>
                                    {checked ? '☑' : '☐'}
                                </span>
                                <span className={checked ? 'text-gray-200' : 'text-gray-500'}>
                                    {item}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
})()}

        </div >
    )
}
