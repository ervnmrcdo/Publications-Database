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

    const publicationIdNum = Number(publicationId);
    const awardIdNum = Number(awardId);

    const { data: existingSubmission, error: draftError } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("publication_id", publicationIdNum)
      .eq("award_id", awardIdNum)
      .eq("status", "DRAFT")
      .single();

    let submissionId: number;

    if (draftError || !existingSubmission) {
      const { data: existingAny, error: checkError } = await supabaseAdmin
        .from("submissions")
        .select("submission_id, status")
        .eq("publication_id", publicationIdNum)
        .eq("award_id", awardIdNum)
        .single();

      if (!checkError && existingAny) {
        if (existingAny.status === "PENDING") {
          return res.status(400).json({ error: "This is already submitted and pending review" });
        }
        submissionId = existingAny.submission_id;
      } else {
        const { data: newSubmission, error: createError } = await supabaseAdmin
          .from("submissions")
          .insert([
            {
              submitter_id: userId,
              award_id: awardIdNum,
              publication_id: publicationIdNum,
              status: "PENDING",
              pdf_json_data: {},
              logs: logs || [],
            },
          ])
          .select("submission_id")
          .single();

        if (createError || !newSubmission) {
          return res.status(400).json({ error: "Failed to create submission: " + createError.message });
        }

        submissionId = newSubmission.submission_id;
      }
    } else {
      submissionId = existingSubmission.submission_id;
    }

    // Ensure publication_award_applications record exists
    const { data: existingLink } = await supabaseAdmin
      .from("publication_award_applications")
      .select("*")
      .eq("publication_id", publicationIdNum)
      .eq("award_id", awardIdNum)
      .single();

    if (!existingLink) {
      await supabaseAdmin
        .from("publication_award_applications")
        .insert([{
          publication_id: publicationIdNum,
          award_id: awardIdNum,
          submission_id: submissionId,
        }]);
    }

    const formTypes = awardIdNum === 1
      ? [41, 42, 43]
      : [44, 43];

    const existingPdfFiles: string[] = [];
    const existingDocxFiles: string[] = [];
    const tempFileMap: Record<string, string> = {};

    for (const formType of formTypes) {
      const fileExt = formType === 41 || formType === 44 || formType === 43 ? "pdf" : "docx";
      const bucket = fileExt === "pdf" ? "drafts-pdf" : "drafts-docx";
      const filePath = `${submissionId}_form${formType}.${fileExt}`;
      const tempFilePath = `${userId}_${publicationIdNum}_${awardIdNum}_form${formType}.${fileExt}`;

      const { data: fileData, error } = await supabaseAdmin.storage
        .from(bucket)
        .download(filePath);

      if (!error && fileData) {
        if (fileExt === "pdf") {
          existingPdfFiles.push(filePath);
        } else {
          existingDocxFiles.push(filePath);
        }
      } else {
        const { data: tempFileData, error: tempError } = await supabaseAdmin.storage
          .from(bucket)
          .download(tempFilePath);

        if (!tempError && tempFileData) {
          tempFileMap[formType] = tempFilePath;
          if (fileExt === "pdf") {
            existingPdfFiles.push(tempFilePath);
          } else {
            existingDocxFiles.push(tempFilePath);
          }
        }
      }
    }

    if (existingPdfFiles.length === 0 && existingDocxFiles.length === 0) {
      return res.status(400).json({ error: "No draft files found to submit. Please save your work in the form editor first." });
    }

    const submission_id = submissionId;

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

      const newFileName = `${submissionId}_form${formType}.pdf`;

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

      const newFileName = `${submissionId}_form${formType}.docx`;

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

    const existingLogs = existingSubmission?.logs || [];
    const updatedLogs = [...existingLogs, ...logs];

    const updateData: Record<string, unknown> = {
      status: 'PENDING',
      logs: updatedLogs,
    };

    if (Object.keys(submissionPaths).length > 0) {
      if (submissionPaths.form41_path) updateData.form41_path = submissionPaths.form41_path;
      if (submissionPaths.form42_path) updateData.form42_path = submissionPaths.form42_path;
      if (submissionPaths.form43_path) updateData.form43_path = submissionPaths.form43_path;
      if (submissionPaths.form44_path) updateData.form44_path = submissionPaths.form44_path;
    }

    const isJournalType = awardIdNum === 1;
    const cleanAttachments = { drive_url: attachments?.drive_url || '' };
    Object.assign(updateData, isJournalType
      ? { journal_attachments: cleanAttachments }
      : { book_attachments: cleanAttachments }
    );

    const { error: updateError } = await supabaseAdmin
      .from("submissions")
      .update(updateData)
      .eq("submission_id", submissionId);

    if (updateError) {
      return res.status(400).json({ error: "Failed to update submission: " + updateError.message });
    }

    return res.status(200).json({
      success: true,
      submission_id: submissionId,
      message: "Submission created successfully"
    });

  } catch (err) {
    console.error("Error submitting award:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
