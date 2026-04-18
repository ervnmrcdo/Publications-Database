import { NextApiRequest, NextApiResponse } from "next";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const supabaseAdmin = createServiceRoleClient();

    const { publicationId, awardId, userId, logs, attachments } = req.body;

    if (!publicationId || !awardId || !userId) {
      return res.status(400).json({ error: "publicationId, awardId, and userId are required" });
    }

    const isJournalType = Number(awardId) === 1;

    const draftFilePaths: string[] = [];
    const formTypes = isJournalType
      ? [41, 42, 43]
      : [44, 43];

    for (const formType of formTypes) {
      const fileExt = formType === 41 || formType === 44 ? "pdf" : "docx";
      const bucket = fileExt === "pdf" ? "drafts-pdf" : "drafts-docx";
      const filePath = `${userId}/${awardId}/${publicationId}/form${formType}.${fileExt}`;
      draftFilePaths.push(filePath);
    }

    const pdfPaths = draftFilePaths.filter(p => p.endsWith(".pdf"));
    const docxPaths = draftFilePaths.filter(p => p.endsWith(".docx"));

    const existingPdfFiles: string[] = [];
    const existingDocxFiles: string[] = [];

    for (const path of pdfPaths) {
      const { data, error } = await supabaseAdmin.storage
        .from("drafts-pdf")
        .download(path);

      if (!error && data) {
        existingPdfFiles.push(path);
      }
    }

    for (const path of docxPaths) {
      const { data, error } = await supabaseAdmin.storage
        .from("drafts-docx")
        .download(path);

      if (!error && data) {
        existingDocxFiles.push(path);
      }
    }

    if (existingPdfFiles.length === 0 && existingDocxFiles.length === 0) {
      return res.status(400).json({ error: "No draft files found to submit" });
    }


    const { data: submissionData, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .insert([
        {
          submitter_id: userId,
          award_id: awardId,
          publication_id: publicationId,
          status: 'PENDING',
          pdf_json_data: {},
          logs,
          ...(isJournalType
            ? { journal_attachments: attachments ?? {} }
            : { book_attachments: attachments ?? {} }
          ),
        }
      ])
      .select();

    if (submissionError) {
      return res.status(400).json({ error: "Failed to create submission: " + submissionError.message });
    }

    const submission_id = submissionData[0].submission_id;

    const submissionPaths: Record<string, string> = {};

    for (const draftPath of existingPdfFiles) {
      const formType = draftPath.includes("form41") ? "41" :
        draftPath.includes("form44") ? "44" : null;
      if (!formType) continue;

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("drafts-pdf")
        .download(draftPath);

      if (downloadError || !fileData) continue;

      const arrayBuffer = await fileData.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const newFileName = formType === "41"
        ? `${submission_id}_form41.pdf`
        : `${submission_id}_form44.pdf`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("submissions-pdf")
        .upload(newFileName, fileBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        submissionPaths[formType === "41" ? "form41_path" : "form44_path"] = uploadData.path;
      }
    }

    for (const draftPath of existingDocxFiles) {
      const formType = draftPath.includes("form42") ? "42" :
        draftPath.includes("form43") ? "43" : null;
      if (!formType) continue;

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("drafts-docx")
        .download(draftPath);

      if (downloadError || !fileData) continue;

      const arrayBuffer = await fileData.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const newFileName = formType === "42"
        ? `${submission_id}_form42.docx`
        : `${submission_id}_form43.docx`;

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


    if (Object.keys(submissionPaths).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("submissions")
        .update(submissionPaths)
        .eq("submission_id", submission_id);

      if (updateError) {
        console.error("Failed to update submission paths:", updateError);
      }
    }

    const { error: junctionError } = await supabaseAdmin
      .from("publication_award_applications")
      .insert([
        {
          publication_id: publicationId,
          award_id: awardId,
          submission_id: submission_id,
        }
      ]);

    if (junctionError) {
      if (junctionError.code === '23505') {
        return res.status(409).json({ error: "This publication has already been applied for this award" });
      }
      return res.status(400).json({ error: "Failed to link submission: " + junctionError.message });
    }

    return res.status(200).json({
      success: true,
      submission_id,
      message: "Submission created successfully"
    });

  } catch (err) {
    console.error("Error submitting award:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
