import { NextApiRequest, NextApiResponse } from "next";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { submission_id, user_id, logs } = req.body;

    if (!submission_id || !user_id) {
      return res.status(400).json({ error: "submission_id and user_id are required" });
    }

    const supabaseAdmin = createServiceRoleClient();

    const { data: existingDraft, error: fetchError } = await supabaseAdmin
      .from("submissions")
      .select("*, awards:awards!award_id(*)")
      .eq("submission_id", submission_id)
      .eq("status", "DRAFT")
      .single();

    if (fetchError || !existingDraft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    const { award_id, publication_id } = existingDraft;
    const isJournalType = award_id === 1;

    const existingPdfFiles: string[] = [];
    const existingDocxFiles: string[] = [];

    if (existingDraft.form41_path) {
      existingPdfFiles.push(existingDraft.form41_path);
    }
    if (existingDraft.form44_path) {
      existingPdfFiles.push(existingDraft.form44_path);
    }
    if (existingDraft.form42_path) {
      existingDocxFiles.push(existingDraft.form42_path);
    }
    if (existingDraft.form43_path) {
      existingPdfFiles.push(existingDraft.form43_path);
    }

    if (existingPdfFiles.length === 0 && existingDocxFiles.length === 0) {
      return res.status(400).json({ error: "No draft files found to submit" });
    }

    const submissionPaths: Record<string, string> = {};

    for (const draftPath of existingPdfFiles) {
      const formType = draftPath.includes("form41") ? "41" :
        draftPath.includes("form44") ? "44" :
          draftPath.includes("form43") ? "43" : null;
      if (!formType) continue;

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("drafts-pdf")
        .download(draftPath);

      if (downloadError || !fileData) continue;

      const arrayBuffer = await fileData.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const newFileName = `${submission_id}_form${formType}.pdf`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("submissions-pdf")
        .upload(newFileName, fileBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        submissionPaths[formType === "41" ? "form41_path" : formType === "44" ? "form44_path" : "form43_path"] = uploadData.path;
      }
    }

    for (const draftPath of existingDocxFiles) {
      const formType = draftPath.includes("form42") ? "42" : null;
      if (!formType) continue;

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("drafts-docx")
        .download(draftPath);

      if (downloadError || !fileData) continue;

      const arrayBuffer = await fileData.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const newFileName = `${submission_id}_form${formType}.docx`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("submissions-docx")
        .upload(newFileName, fileBuffer, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        submissionPaths[`form${formType}_path`] = uploadData.path;
      }
    }

    const { data: existingSubmission } = await supabaseAdmin
      .from("submissions")
      .select("logs")
      .eq("submission_id", submission_id)
      .single();

    const existingLogs = existingSubmission?.logs || [];
    const updatedLogs = [...existingLogs, ...logs];

    const updateData: Record<string, unknown> = {
      status: "PENDING",
      logs: updatedLogs,
    };

    if (submissionPaths.form41_path) updateData.form41_path = submissionPaths.form41_path;
    if (submissionPaths.form42_path) updateData.form42_path = submissionPaths.form42_path;
    if (submissionPaths.form43_path) updateData.form43_path = submissionPaths.form43_path;
    if (submissionPaths.form44_path) updateData.form44_path = submissionPaths.form44_path;

    const attachments = req.body.attachments;
    if (attachments) {
      const cleanAttachments = { drive_url: attachments.drive_url || '' };
      if (isJournalType) {
        updateData.journal_attachments = cleanAttachments;
      } else {
        updateData.book_attachments = cleanAttachments;
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("submissions")
      .update(updateData)
      .eq("submission_id", submission_id);

    if (updateError) {
      return res.status(400).json({ error: "Failed to submit draft: " + updateError.message });
    }

    return res.status(200).json({
      success: true,
      submission_id,
      message: "Draft submitted successfully",
    });
  } catch (err) {
    console.error("Error submitting draft:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}