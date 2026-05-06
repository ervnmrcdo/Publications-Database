'use client'
import * as jose from 'jose';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { useState, useEffect, useMemo, forwardRef, useCallback } from "react";
import { generateUUID } from "@/lib/uuid";

interface FormEditorProps {
    publicationId: string;
    documentUrl?: string;
    awardId?: number;
    userId?: string;
    onSaveNeeded?: () => void;
}

export default forwardRef(function Form41Editor({ publicationId, documentUrl, awardId, userId }: FormEditorProps, ref) {
    const [token, setToken] = useState("");
    const documentKey = useMemo(() => generateUUID(), [])
    const detectedIp = useMemo(() => typeof window !== 'undefined' ? window.location.hostname : '', [])

    const documentUrlFinal = `http://host.docker.internal:3000/api/generate-form/ipa-41?publicationId=${publicationId}&awardId=${awardId}&user_id=${userId}`;

    const onDocumentReady = useCallback(async () => {
        try {
            await fetch("/api/drafts/forcesave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: documentKey }),
            });
        } catch (err) {
            console.error('Error calling force-save command')
        }
    }, [documentKey]);

    const config = useMemo(() => ({
        document: {
            fileType: "pdf",
            key: documentKey,
            title: "4.1-template",
            url: documentUrlFinal,
        },
        documentType: "pdf",
        editorConfig: {
            mode: "edit",
            callbackUrl: `http://host.docker.internal:3000/api/drafts/callback?publicationId=${publicationId}&awardId=${awardId}&formType=41&user_id=${userId}`,
            customization: {
                macros: true,
                macrosMode: "enable",
                autosave: true,
                forcesave: true,
            },
        },
    }), [publicationId, documentKey, documentUrl, awardId, userId, detectedIp, documentUrlFinal, onDocumentReady]);

    useEffect(() => {
        const generateToken = async () => {
            const secret = new TextEncoder().encode('my_super_secret_key');
            const signedToken = await new jose.SignJWT(config)
                .setProtectedHeader({ alg: 'HS256' })
                .sign(secret);
            setToken(signedToken);
        };

        generateToken();
    }, [config]);

    if (!token) return <div>Generating secure access...</div>;

    return (
        <div style={{ height: "600px" }}>
            <DocumentEditor
                id="docxEditor"
                documentServerUrl={`http://${detectedIp}:8080/`}
                config={{
                    ...config,
                    token: token,
                }}
                events_onDocumentReady={onDocumentReady}
            />
        </div>
    );
})
