import { DraftForm } from "@/lib/types"
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import * as jose from 'jose';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { useAuth } from "@/context/AuthContext";
import { useSubmissionsFlow } from "@/context/SubmissionsFlowContext";

type Props = {
    data: DraftForm;
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
        callbackUrl?: string;
        customization: {
            macros: boolean;
            macrosMode?: string;
            autosave: boolean;
            forcesave: boolean;
        };
    };
}

export default function DraftInstance({ data, onBack }: Props) {
    const { setSelected } = useSubmissionsFlow()
    const { profile, user } = useAuth()

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

    const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState<boolean>(false);

    const [expandedForm41, setExpandedForm41] = useState<boolean>(false);
    const [expandedForm42, setExpandedForm42] = useState<boolean>(false);
    const [expandedForm43, setExpandedForm43] = useState<boolean>(false);
    const [expandedForm44, setExpandedForm44] = useState<boolean>(false);

    const detectedIp = useMemo(() => typeof window !== 'undefined' ? window.location.hostname : '', [])

    const publicationId = data.publication_id?.toString() || ""
    const awardId = data.award_id || 1
    const submitterId = data.submitter_id || user?.id || ""
    const submissionId = data.submission_id

    const getActorName = () => {
        return profile ? `${profile.first_name} ${profile.last_name}` : 'User';
    };

    const handleSubmitDraft = async () => {
        try {
            const submissionLog = {
                action: 'SUBMITTED',
                remarks: '',
                date: new Date().toISOString(),
                actor_name: getActorName(),
            }

            const payload = {
                submission_id: submissionId,
                user_id: user?.id,
                logs: [submissionLog],
            }

            const response = await fetch('/api/submit-from-draft/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                alert('Draft submitted successfully')
                setSelected(null)
            } else {
                const result = await response.json()
                alert('Failed to submit draft: ' + result.error)
            }
        } catch (err) {
            console.error('Error submitting draft:', err)
            alert('Failed to submit draft')
        }
    }

    const generateToken = useCallback(async (config: DocumentConfig) => {
        const secret = new TextEncoder().encode('my_super_secret_key');
        return await new jose.SignJWT(config as unknown as jose.JWTPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret);
    }, []);

    const baseUrl = `http://host.docker.internal:3000`
    const callbackBaseUrl = `${baseUrl}/api/drafts/callback`

    const generateConfig = useCallback(async (
        formType: string,
        fileType: string,
        documentType: string,
        title: string
    ): Promise<{ config: DocumentConfig; token: string }> => {
        const generateUrl = `${baseUrl}/api/generate-form/ipa-${formType}?publicationId=${publicationId}&awardId=${awardId}&user_id=${submitterId}`
        const callbackUrl = `${callbackBaseUrl}?publicationId=${publicationId}&awardId=${awardId}&formType=${formType}&user_id=${submitterId}`

        const config: DocumentConfig = {
            document: {
                fileType: fileType,
                key: crypto.randomUUID(),
                title: title,
                url: generateUrl,
            },
            documentType: documentType,
            editorConfig: {
                mode: "edit",
                callbackUrl: callbackUrl,
                customization: {
                    macros: true,
                    macrosMode: "enable",
                    autosave: true,
                    forcesave: true,
                },
            },
        };

        const token = await generateToken(config);
        return { config, token };
    }, [publicationId, awardId, submitterId, generateToken]);

    const generateForm41Config = useCallback(async () => {
        setLoadingForm41(true);
        try {
            const form41 = await generateConfig("41", "pdf", "pdf", "4.1");
            setPdfConfigs(prev => ({ ...prev, form41: form41 }));
        } catch (err) {
            console.error('Error loading form 4.1:', err);
        } finally {
            setLoadingForm41(false);
        }
    }, [generateConfig]);

    const generateForm44Config = useCallback(async () => {
        setLoadingForm44(true);
        try {
            const form44 = await generateConfig("44", "pdf", "pdf", "4.4");
            setPdfConfigs(prev => ({ ...prev, form44: form44 }));
        } catch (err) {
            console.error('Error loading form 4.4:', err);
        } finally {
            setLoadingForm44(false);
        }
    }, [generateConfig]);

    const generateForm42Config = useCallback(async () => {
        setLoadingForm42(true);
        try {
            const form42 = await generateConfig("42", "docx", "word", "4.2");
            setDocxConfigs(prev => ({ ...prev, form42: form42 }));
        } catch (err) {
            console.error('Error loading form 4.2:', err);
        } finally {
            setLoadingForm42(false);
        }
    }, [generateConfig]);

    const generateForm43Config = useCallback(async () => {
        setLoadingForm43(true);
        try {
            const form43 = await generateConfig("43", "docx", "word", "4.3");
            setDocxConfigs(prev => ({ ...prev, form43: form43 }));
        } catch (err) {
            console.error('Error loading form 4.3:', err);
        } finally {
            setLoadingForm43(false);
        }
    }, [generateConfig]);

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

    const hasForm41 = !!data.form42_url || !!data.form43_url || !!data.form44_url;
    const hasForm42 = !!data.form42_url;
    const hasForm43 = !!data.form43_url;
    const hasForm44 = !!data.form44_url;

    const getEditorConfig = useCallback((config: DocumentConfig, token: string) => ({
        ...config,
        token: token,
    }), []);

    return (
        <div className="bg-[#1b1e2b] rounded-xl shadow p-6 space-y-4">
            <button
                onClick={onBack}
                className="flex items-center text-gray-400 hover:text-white mb-2"
            >
                <ArrowLeft className="mr-2" /> Back
            </button>

            <div className="p-4 bg-[#252836] rounded-lg">
                <p className="font-bold text-lg text-white">{data.publication_title}</p>
                <p className="text-sm text-gray-300">{data.award_title}</p>
                <p className="text-xs text-gray-400">{data.date_submitted}</p>
            </div>

            {data.tagged_authors && data.tagged_authors.length > 0 && (
                <div className="p-4 bg-[#252836] rounded-lg">
                    <p className="font-bold text-med text-white mb-2">Tagged Authors:</p>
                    <div className="flex flex-wrap gap-2">
                        {data.tagged_authors.map((author: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">
                                {author.first_name} {author.last_name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={() => setShowSubmitConfirmDialog(true)}
                >
                    Submit
                </button>
            </div>

            {/* Form 4.1 - PDF */}
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
                                        id="form41Editor"
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

            {/* Form 4.2 - DOCX */}
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
                                        id="form42Editor"
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

            {/* Form 4.3 - DOCX */}
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
                                        id="form43Editor"
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

            {/* Form 4.4 - PDF */}
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
                                        id="form44Editor"
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


            {/* Submit Confirmation Dialog */}
            {showSubmitConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-white">Confirm Submit</h3>
                        <p className="text-sm text-gray-300 mb-6">
                            Are you sure you want to submit this draft? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 border rounded-md hover:bg-gray-700"
                                onClick={() => setShowSubmitConfirmDialog(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                onClick={() => {
                                    setShowSubmitConfirmDialog(false);
                                    handleSubmitDraft();
                                }}
                            >
                                Confirm Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}