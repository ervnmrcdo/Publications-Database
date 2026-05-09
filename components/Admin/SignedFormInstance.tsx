import { AcceptedForm } from "@/lib/types"
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { generateUUID } from "@/lib/uuid";

const STATUS_OPTIONS = [
  { value: 'VALIDATED', label: 'Validated', color: 'bg-green-900/30 text-green-400' },
  { value: 'SUBMITTED_TO_HIGHER_OFFICE', label: 'Submitted to Higher Offices', color: 'bg-purple-900/30 text-purple-400' },
  { value: 'PROCESSED_BY_HIGHER_OFFICE', label: 'Processed by Higher Offices', color: 'bg-gray-900/30 text-gray-400' },
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

export default function SignedFormInstance({ data, onBack }: Props) {
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

  const detectedIp = useMemo(() => typeof window !== 'undefined' ? window.location.hostname : '', [])

  const generateToken = useCallback(async (config: DocumentConfig) => {
    const response = await fetch("/api/onlyoffice/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    const data = await response.json();
    return data.token;
  }, []);

  const generateForm41Config = useCallback(async () => {
    if (!data.submission_id) return;
    setLoadingForm41(true);
    try {
      const baseUrl = `http://host.docker.internal:3000`;
      const documentUrl = `${baseUrl}/api/admin/get-signed-form/route?submission_id=${data.submission_id}&form_type=41`;
      const config: DocumentConfig = {
        document: {
          fileType: "pdf",
          key: generateUUID(),
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
      const documentUrl = `${baseUrl}/api/admin/get-signed-form/route?submission_id=${data.submission_id}&form_type=44`;
      const config: DocumentConfig = {
        document: {
          fileType: "pdf",
          key: generateUUID(),
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
      const documentUrl = `${baseUrl}/api/admin/get-signed-form/route?submission_id=${data.submission_id}&form_type=42`;
      const config: DocumentConfig = {
        document: {
          fileType: "docx",
          key: generateUUID(),
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
      const documentUrl = `${baseUrl}/api/admin/get-signed-form/route?submission_id=${data.submission_id}&form_type=43`;
      const config: DocumentConfig = {
        document: {
          fileType: "pdf",
          key: generateUUID(),
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
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-lg text-white">{data.first_name + ' ' + data.last_name}</p>
            <p className="text-sm text-gray-300">{data.award_title}</p>
            <p className="text-xs text-gray-400">{data.date_submitted}</p>
          </div>
          {data.status && (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(data.status)}`}>
              {getStatusLabel(data.status)}
            </span>
          )}
        </div>
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

      {(!hasForm41 && !hasForm42 && !hasForm43 && !hasForm44) && (
        <div className="p-4 bg-[#252836] rounded-lg">
          <p className="text-gray-400">No documents attached.</p>
        </div>
      )}
    </div>
  )
}