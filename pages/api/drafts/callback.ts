import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const supabase = createPagesServerClient(req, res);
    const supabaseAdmin = createServiceRoleClient();

    const { publicationId, awardId, formType, user_id } = req.query;
    const body = req.body;

    if (!publicationId || !awardId || !formType || !user_id) {
      return res
        .status(400)
        .json({ error: "publication_id, award_id, form_type, and user_id are required" });
    }

    if (body.status === 2 || body.status === 6) {
      const publicationIdNum = Number(publicationId);
      const awardIdNum = Number(awardId);

      const { data: existingDraft, error: fetchDraftError } = await supabaseAdmin
        .from("submissions")
        .select("submission_id, status")
        .eq("publication_id", publicationIdNum)
        .eq("award_id", awardIdNum)
        .in("status", ["DRAFT", "RETURNED"])
        .single();

      let submissionId: number | null = null;
      let currentStatus: string | null = null;

      if (existingDraft) {
        submissionId = existingDraft.submission_id;
        currentStatus = existingDraft.status;
      }

      const resp = await fetch(body.url);
      if (!resp.ok) return res.status(500).json({ message: 'Downloading the file failed.' });

      const arrayBuffer = await resp.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const fileExt = formType === "41" || formType === "44" || formType === "43" ? "pdf" : "docx";
      const bucket = fileExt === "pdf" ? "drafts-pdf" : "drafts-docx";

      let filePath: string;

      if (submissionId) {
        filePath = `${submissionId}_form${formType}.${fileExt}`;
      } else {
        filePath = `${user_id}_${publicationIdNum}_${awardIdNum}_form${formType}.${fileExt}`;
      }

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType:
            fileExt === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });

      if (uploadError) {
        console.log(uploadError);
        return res.status(400).json({ error: uploadError.message });
      }

      if (submissionId) {
        const fieldName = `form${formType}_path`;
        await supabaseAdmin
          .from("submissions")
          .update({ [fieldName]: filePath })
          .eq("submission_id", submissionId);
      }

      const { data: submissionData } = await supabaseAdmin
        .from("submissions")
        .select("logs")
        .eq("submission_id", submissionId)
        .single();

      const currentLogs = submissionData?.logs || [];

      if (currentLogs.length > 0 && submissionId) {
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("first_name, middle_name, last_name")
          .eq("id", user_id)
          .single();

        const actorName = user
          ? `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim()
          : 'Unknown';

        const formNumber = formType.toString().slice(-1);

        const newLog = {
          remarks: submissionId ? `Form 4.${formNumber} updated (${currentStatus})` : `Form 4.${formNumber} auto-saved`,
          date: new Date().toLocaleString(),
          action: 'DRAFT_EDITED',
          actor_name: actorName
        };

        const isDuplicate = currentLogs.some((log: any) =>
          log.action === newLog.action &&
          log.actor_name === newLog.actor_name &&
          log.remarks === newLog.remarks &&
          log.date === newLog.date
        );

        if (!isDuplicate) {
          const updatedLogs = [...currentLogs, newLog];
          await supabaseAdmin
            .from("submissions")
            .update({ logs: updatedLogs })
            .eq("submission_id", submissionId);
        }
      }

      if (!submissionId) {
        return res
          .status(200)
          .json({ error: 0, message: "File saved temporarily", path: uploadData.path, is_temporary: true });
      }

      return res
        .status(200)
        .json({ error: 0, message: "Draft saved successfully", path: uploadData.path, submission_id: submissionId });
    }
    return res.status(200).json({ error: 0 });
  } catch (err) {
    console.error("Error saving draft:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
