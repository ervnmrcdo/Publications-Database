import { useState, useMemo, useCallback, useEffect } from "react";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Application, SubmissionLog } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useReviewFlow } from "@/context/ReviewFlowContext";
import * as jose from 'jose';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import AttachmentsSection from '@/components/Review/AttachmentsSection';

type Props = {
  data: Application;
  onBack: () => void;
};

interface DocumentConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
  };
  documentType: string;
  editorConfig: {
    callbackUrl?: string;
    mode: string;
    customization: {
      forcesave: boolean;
      autosave: boolean;
    };
  };
}

export default function ReviewInstance({ data, onBack }: Props) {
  const { setSelected } = useReviewFlow()
  const [docxConfigs, setDocumentConfigs] = useState<{
    form42?: { config: DocumentConfig; token: string };
    form43?: { config: DocumentConfig; token: string };
  }>({});
  const [pdfConfigs, setPdfConfigs] = useState<{
    form41?: { config: DocumentConfig; token: string };
    form44?: { config: DocumentConfig; token: string };
  }>({});
  const { user, profile } = useAuth()

  const [loadingForm41, setLoadingForm41] = useState<boolean>(false);
  const [loadingForm42, setLoadingForm42] = useState<boolean>(false);
  const [loadingForm43, setLoadingForm43] = useState<boolean>(false);
  const [loadingForm44, setLoadingForm44] = useState<boolean>(false);

  const [form41Key, setForm41Key] = useState<string>("");
  const [form42Key, setForm42Key] = useState<string>("");
  const [form43Key, setForm43Key] = useState<string>("");
  const [form44Key, setForm44Key] = useState<string>("");

  const [errorRemarks, setErrorRemarks] = useState<string>("");
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
  const [showSignConfirmDialog, setShowSignConfirmDialog] = useState<boolean>(false);
  const [showSignatureWarning, setShowSignatureWarning] = useState<boolean>(false);
  const [signatureWarningDismissed, setSignatureWarningDismissed] = useState<boolean>(false);

  const [expandedForm41, setExpandedForm41] = useState<boolean>(false);
  const [expandedForm42, setExpandedForm42] = useState<boolean>(false);
  const [expandedForm43, setExpandedForm43] = useState<boolean>(false);
  const [expandedForm44, setExpandedForm44] = useState<boolean>(false);

  const detectedIp = useMemo(() => typeof window !== 'undefined' ? window.location.hostname : '', [])

  useEffect(() => {
    const checkSignature = async () => {
      if (!user?.id || signatureWarningDismissed) return;

      try {
        const response = await fetch(`/api/admin/get-user-signature/route?user_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.hasSignature) {
            setShowSignatureWarning(true);
          }
        }
      } catch (err) {
        console.error('Error checking signature:', err);
      }
    };

    checkSignature();
  }, [user?.id, signatureWarningDismissed]);

  const dismissSignatureWarning = () => {
    setShowSignatureWarning(false);
    setSignatureWarningDismissed(true);
  };

  const getActorName = () => {
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Admin';
  };

  const acceptPDF = async () => {
    try {
      const verifiedLog: SubmissionLog = {
        action: 'VALIDATED',
        remarks: '',
        date: new Date().toISOString(),
        actor_name: getActorName(),
      }

      const newLogs = [...data.logs]
      newLogs.push(verifiedLog)

      const payload = {
        admin_id: user?.id,
        submission_id: data.application_id,
        newLogs
      }

      const response = await fetch('/api/admin/sign-and-submit/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json() as {
        error?: string;
        results?: Record<string, { success: boolean; error?: string; path?: string }>;
      };
      
      if (response.ok) {
        // Build success/failure message based on results
        const results = result.results;
        const successForms: string[] = [];
        const failedForms: string[] = [];
        
        if (results) {
          Object.entries(results).forEach(([form, res]) => {
            if (res.success) {
              successForms.push(form);
            } else {
              failedForms.push(`${form}: ${res.error}`);
            }
          });
        }
        
        let message = 'Form Signed and Returned';
        if (successForms.length > 0) {
          message += `\n\nSuccessfully processed: ${successForms.join(', ')}`;
        }
        if (failedForms.length > 0) {
          message += `\n\nFailed to process: ${failedForms.join(', ')}`;
        }
        
        alert(message);
        setSelected(null);
      } else {
        // Show detailed error with results if available
        let errorDetails = result.error || 'Unknown error';
        if (result.results) {
          const errors = Object.entries(result.results)
            .filter(([, r]) => !r.success)
            .map(([form, r]) => `${form}: ${r.error}`);
          if (errors.length > 0) {
            errorDetails += `\n\nFailed forms:\n${errors.join('\n')}`;
          }
        }
        alert('Failed to return signed form: ' + errorDetails);
      }
    } catch (err) {
      alert(err)
    }
  }

  const returnPDF = async () => {
    if (!errorRemarks.trim()) {
      alert('Please provide error remarks');
      return;
    }

    const returnedLog: SubmissionLog = {
      action: 'RETURNED',
      remarks: errorRemarks,
      date: new Date().toISOString(),
      actor_name: getActorName(),
    }

    const newLogs = [...data.logs]
    newLogs.push(returnedLog)

    try {
      const payload = {
        admin_id: user?.id,
        submission_id: data.application_id,
        remarks: errorRemarks,
        logs: newLogs,
      }

      const rejectPdf = await fetch('/api/admin/return-form/route', {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (rejectPdf.ok) {
        alert('Form returned.')
        setSelected(null)
      }
    } catch (err) {
      alert(err)
    }
  }

  const generateToken = useCallback(async (config: DocumentConfig) => {
    const secret = new TextEncoder().encode('my_super_secret_key');
    return await new jose.SignJWT(config as unknown as jose.JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);
  }, []);

  const onForm41Ready = useCallback(async () => {
    if (!form41Key) return;
    try {
      await fetch("/api/drafts/forcesave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: form41Key }),
      });
    } catch (err) {
      console.error('Error calling force-save for form 4.1');
    }
  }, [form41Key]);

  const onForm42Ready = useCallback(async () => {
    if (!form42Key) return;
    try {
      await fetch("/api/drafts/forcesave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: form42Key }),
      });
    } catch (err) {
      console.error('Error calling force-save for form 4.2');
    }
  }, [form42Key]);

  const onForm43Ready = useCallback(async () => {
    if (!form43Key) return;
    try {
      await fetch("/api/drafts/forcesave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: form43Key }),
      });
    } catch (err) {
      console.error('Error calling force-save for form 4.3');
    }
  }, [form43Key]);

  const onForm44Ready = useCallback(async () => {
    if (!form44Key) return;
    try {
      await fetch("/api/drafts/forcesave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: form44Key }),
      });
    } catch (err) {
      console.error('Error calling force-save for form 4.4');
    }
  }, [form44Key]);

  const generateForm41Config = useCallback(async () => {
    if (!user?.id) return;
    setLoadingForm41(true);
    try {
      const documentKey = crypto.randomUUID();
      setForm41Key(documentKey);
      const documentUrl = `http://host.docker.internal:3000/api/admin/get-review-form/route?submission_id=${data.application_id}&form_type=41&admin_id=${user.id}`;
      const callbackUrl = `http://host.docker.internal:3000/api/admin/drafts/callback?submission_id=${data.application_id}&form_type=41&admin_id=${user.id}`;

      const config: DocumentConfig = {
        document: {
          fileType: "pdf",
          key: documentKey,
          title: "4.1-signed",
          url: documentUrl,
        },
        documentType: "pdf",
        editorConfig: {
          mode: "edit",
          callbackUrl: callbackUrl,
          customization: {
            forcesave: true,
            autosave: true,
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
  }, [data.application_id, user?.id, generateToken, form41Key]);

  const generateForm44Config = useCallback(async () => {
    if (!user?.id) return;
    setLoadingForm44(true);
    try {
      const documentKey = crypto.randomUUID();
      setForm44Key(documentKey);
      const documentUrl = `http://host.docker.internal:3000/api/admin/get-review-form/route?submission_id=${data.application_id}&form_type=44&admin_id=${user.id}`;
      const callbackUrl = `http://host.docker.internal:3000/api/admin/drafts/callback?submission_id=${data.application_id}&form_type=44&admin_id=${user.id}`;

      const config: DocumentConfig = {
        document: {
          fileType: "pdf",
          key: documentKey,
          title: "4.4-signed",
          url: documentUrl,
        },
        documentType: "pdf",
        editorConfig: {
          callbackUrl: callbackUrl,
          mode: "edit",
          customization: {
            forcesave: true,
            autosave: true,
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
  }, [data.application_id, user?.id, generateToken, form44Key]);

  const generateForm42Config = useCallback(async () => {
    if (!user?.id) return;
    setLoadingForm42(true);
    try {
      const documentKey = crypto.randomUUID();
      setForm42Key(documentKey);
      const documentUrl = `http://host.docker.internal:3000/api/admin/get-review-form/route?submission_id=${data.application_id}&form_type=42&admin_id=${user.id}`;
      const callbackUrl = `http://host.docker.internal:3000/api/admin/drafts/callback?submission_id=${data.application_id}&form_type=42&admin_id=${user.id}`;

      const config: DocumentConfig = {
        document: {
          fileType: "docx",
          key: documentKey,
          title: "4.2",
          url: documentUrl,
        },
        documentType: "word",
        editorConfig: {
          callbackUrl: callbackUrl,
          mode: "edit",
          customization: {
            forcesave: true,
            autosave: true,
          },
        },
      };
      const token = await generateToken(config);
      setDocumentConfigs(prev => ({ ...prev, form42: { config, token } }));
    } catch (err) {
      console.error('Error loading form 4.2:', err);
    } finally {
      setLoadingForm42(false);
    }
  }, [data.application_id, user?.id, generateToken, form42Key]);

  const generateForm43Config = useCallback(async () => {
    if (!user?.id) return;
    setLoadingForm43(true);
    try {
      const documentKey = crypto.randomUUID();
      setForm43Key(documentKey);
      const documentUrl = `http://host.docker.internal:3000/api/admin/get-review-form/route?submission_id=${data.application_id}&form_type=43&admin_id=${user.id}`;
      const callbackUrl = `http://host.docker.internal:3000/api/admin/drafts/callback?submission_id=${data.application_id}&form_type=43&admin_id=${user.id}`;

      const config: DocumentConfig = {
        document: {
          fileType: "pdf",
          key: documentKey,
          title: "4.3",
          url: documentUrl,
        },
        documentType: "pdf",
        editorConfig: {
          callbackUrl: callbackUrl,
          mode: "edit",
          customization: {
            forcesave: true,
            autosave: true,
          },
        },
      };
      const token = await generateToken(config);
      setDocumentConfigs(prev => ({ ...prev, form43: { config, token } }));
    } catch (err) {
      console.error('Error loading form 4.3:', err);
    } finally {
      setLoadingForm43(false);
    }
  }, [data.application_id, user?.id, generateToken, form43Key]);

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
      setDocumentConfigs(prev => { const { form42, ...rest } = prev; return rest; });
    } else {
      await generateForm42Config();
    }
    setExpandedForm42(!expandedForm42);
  };

  const handleToggleForm43 = async () => {
    if (expandedForm43) {
      setDocumentConfigs(prev => { const { form43, ...rest } = prev; return rest; });
    } else {
      await generateForm43Config();
    }
    setExpandedForm43(!expandedForm43);
  };

  const hasForm41 = !!data.form41Url;
  const hasForm42 = !!data.form42Url;
  const hasForm43 = !!data.form43Url;
  const hasForm44 = !!data.form44Url;

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
        <p className="font-bold text-lg text-white">{data.publicationTitle || 'Untitled Publication'}</p>
        <p className="text-sm text-gray-300">{data.name} &middot; {data.award}</p>
        <p className="text-xs text-gray-400">{new Date(data.dateSubmitted).toLocaleString()}</p>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition" onClick={() => setShowSignConfirmDialog(true)}>
          Sign and Return
        </button>
        <button className="px-4 py-2 border border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition"
          onClick={() => setShowErrorDialog(true)}
        >Return with Errors</button>
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

          {
            expandedForm41 && (
              <div className="border rounded-lg p-4 h-[calc(100vh-40px)] bg-[#1a1e2b]">
                {loadingForm41 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Loading form...</div>
                  </div>
                ) : pdfConfigs.form41?.config && pdfConfigs.form41?.token ? (
                  <div style={{ height: '100%' }}>
                    <DocumentEditor
                      id="pdfEditor-form41"
                      documentServerUrl={`http://${detectedIp}:8080/`}
                      config={getEditorConfig(pdfConfigs.form41.config, pdfConfigs.form41.token)}
                    />
                  </div>
                ) : (
                  <p className="text-gray-400">No PDF attached.</p>
                )}
              </div>
            )}
        </div>
      )}

      {
        hasForm42 && (
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
                    <div className="text-gray-400">Loading form...</div>
                  </div>
                ) : docxConfigs.form42?.config && docxConfigs.form42?.token ? (
                  <div style={{ height: '100%' }}>
                    <DocumentEditor
                      id="pdfEditor-form42"
                      documentServerUrl={`http://${detectedIp}:8080/`}
                      config={getEditorConfig(docxConfigs.form42.config, docxConfigs.form42.token)}
                    />
                  </div>
                ) : (
                  <p className="text-gray-400">No document attached.</p>
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
                  <div className="text-gray-400">Loading form...</div>
                </div>
              ) : docxConfigs.form43?.config && docxConfigs.form43?.token ? (
                <div style={{ height: '100%' }}>
                  <DocumentEditor
                    id="pdfEditor-form43"
                    documentServerUrl={`http://${detectedIp}:8080/`}
                    config={getEditorConfig(docxConfigs.form43.config, docxConfigs.form43.token)}
                  />
                </div>
              ) : (
                <p className="text-gray-400">No document attached.</p>
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
                  <div className="text-gray-400">Loading form...</div>
                </div>
              ) : pdfConfigs.form44?.config && pdfConfigs.form44?.token ? (
                <div style={{ height: '100%' }}>
                  <DocumentEditor
                    id="pdfEditor-form44"
                    documentServerUrl={`http://${detectedIp}:8080/`}
                    config={getEditorConfig(pdfConfigs.form44.config, pdfConfigs.form44.token)}
                  />
                </div>
              ) : (
                <p className="text-gray-400">No PDF attached.</p>
              )}
            </div>
          )}
        </div>
      )}

      <AttachmentsSection
        isJournal={data.awardId === 1}
        journal_attachments={data.journal_attachments}
        book_attachments={data.book_attachments}
      />

      {
        showErrorDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-white">Return with Errors</h3>
              <p className="text-sm text-gray-300 mb-2">
                Please specify the errors or issues found in this submission:
              </p>
              <textarea
                className="w-full border rounded-md p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Missing signatures on page 3, Incorrect dates, etc."
                value={errorRemarks}
                onChange={(e) => setErrorRemarks(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  className="px-4 py-2 border rounded-md hover:bg-gray-700"
                  onClick={() => {
                    setErrorRemarks("");
                    setShowErrorDialog(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                  onClick={returnPDF}
                  disabled={!errorRemarks.trim()}
                >
                  Submit Errors
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showSignConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-white">Confirm Sign Form</h3>
              <p className="text-sm text-gray-300 mb-6">
                Are you sure you want to sign this form? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border rounded-md hover:bg-gray-700"
                  onClick={() => setShowSignConfirmDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  onClick={() => {
                    setShowSignConfirmDialog(false);
                    acceptPDF();
                  }}
                >
                  Confirm Sign
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showSignatureWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4 border border-yellow-500">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">No Signature Uploaded</h3>
              <p className="text-sm text-gray-300 mb-4">
                You have not uploaded a signature. Please upload your signature in your profile before reviewing submissions.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                You can proceed without a signature but it will not appear on the form.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border rounded-md hover:bg-gray-700"
                  onClick={dismissSignatureWarning}
                >
                  Proceed Anyway
                </button>
                <button
                  className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600"
                  onClick={() => {
                    dismissSignatureWarning();
                    window.location.href = '/profile';
                  }}
                >
                  Go to Profile
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
