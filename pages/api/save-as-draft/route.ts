import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { publicationId, awardId, user_id, attachments, checklist } = req.body;

    if (!publicationId || !awardId || !user_id) {
      return res
        .status(400)
        .json({ error: "publicationId, awardId, and user_id are required" });
    }

    const supabaseAdmin = createServiceRoleClient();

    const publicationIdNum = Number(publicationId);
    const awardIdNum = Number(awardId);

    const { data: existingDraft, error: fetchError } = await supabaseAdmin
      .from("submissions")
      .select("submission_id, status")
      .eq("publication_id", publicationIdNum)
      .eq("award_id", awardIdNum)
      .in("status", ["DRAFT", "RETURNED"])
      .single();

    let submission_id: number;
    let isNewDraft = false;

    if (existingDraft) {
      submission_id = existingDraft.submission_id;
      if (existingDraft.status !== "DRAFT") {
        await supabaseAdmin
          .from("submissions")
          .update({ status: "DRAFT" })
          .eq("submission_id", submission_id);
      }
    } else {
      await supabaseAdmin
        .from("publication_award_applications")
        .delete()
        .eq("publication_id", publicationIdNum)
        .eq("award_id", awardIdNum);

      const { data: newDraft, error: createError } = await supabaseAdmin
        .from("submissions")
        .insert([
          {
            submitter_id: user_id,
            award_id: awardIdNum,
            publication_id: publicationIdNum,
            status: "DRAFT",
            pdf_json_data: {},
            logs: [],
          },
        ])
        .select("submission_id")
        .single();

      if (createError) {
        return res.status(400).json({ error: "Failed to create draft: " + createError.message });
      }

      submission_id = newDraft.submission_id;
      isNewDraft = true;

      await supabaseAdmin
        .from("publication_award_applications")
        .insert([
          {
            publication_id: publicationIdNum,
            award_id: awardIdNum,
            submission_id: submission_id,
          },
        ]);

      const tempPdfFiles = [
        `${user_id}_${publicationIdNum}_${awardIdNum}_form41.pdf`,
        `${user_id}_${publicationIdNum}_${awardIdNum}_form44.pdf`,
        `${user_id}_${publicationIdNum}_${awardIdNum}_form43.pdf`,
      ];
      const tempDocxFiles = [
        `${user_id}_${publicationIdNum}_${awardIdNum}_form42.docx`,
      ];

      for (const tempPath of tempPdfFiles) {
        try {
          const { data: tempFile } = await supabaseAdmin.storage
            .from("drafts-pdf")
            .download(tempPath);
          
          if (tempFile) {
            const formType = tempPath.includes("form41") ? "41" : tempPath.includes("form44") ? "44" : "43";
            const newPath = `${submission_id}_form${formType}.pdf`;
            const fileBuffer = Buffer.from(await tempFile.arrayBuffer());
            
            await supabaseAdmin.storage
              .from("drafts-pdf")
              .upload(newPath, fileBuffer, { upsert: true });
            
            await supabaseAdmin
              .from("submissions")
              .update({ [`form${formType}_path`]: newPath })
              .eq("submission_id", submission_id);
          }
        } catch (e) {
        }
      }

      for (const tempPath of tempDocxFiles) {
        try {
          const { data: tempFile } = await supabaseAdmin.storage
            .from("drafts-docx")
            .download(tempPath);
          
          if (tempFile) {
            const formType = "42";
            const newPath = `${submission_id}_form${formType}.docx`;
            const fileBuffer = Buffer.from(await tempFile.arrayBuffer());
            
            await supabaseAdmin.storage
              .from("drafts-docx")
              .upload(newPath, fileBuffer, { upsert: true });
            
            await supabaseAdmin
              .from("submissions")
              .update({ [`form${formType}_path`]: newPath })
              .eq("submission_id", submission_id);
          }
        } catch (e) {
        }
      }

      await supabaseAdmin.storage.from("drafts-pdf").remove(tempPdfFiles);
      await supabaseAdmin.storage.from("drafts-docx").remove(tempDocxFiles);

      const { data: allPdfFiles } = await supabaseAdmin.storage
        .from("drafts-pdf")
        .list("", { limit: 100 });
      
      const otherPdfTempFiles = allPdfFiles
        ?.filter(f => f.name.includes(`_${publicationIdNum}_${awardIdNum}_form`) && !f.name.startsWith(user_id))
        .map(f => f.name) || [];

      if (otherPdfTempFiles.length > 0) {
        await supabaseAdmin.storage.from("drafts-pdf").remove(otherPdfTempFiles);
      }

      const { data: allDocxFiles } = await supabaseAdmin.storage
        .from("drafts-docx")
        .list("", { limit: 100 });
      
      const otherDocxTempFiles = allDocxFiles
        ?.filter(f => f.name.includes(`_${publicationIdNum}_${awardIdNum}_form`) && !f.name.startsWith(user_id))
        .map(f => f.name) || [];

      if (otherDocxTempFiles.length > 0) {
        await supabaseAdmin.storage.from("drafts-docx").remove(otherDocxTempFiles);
      }

      const { data: user } = await supabaseAdmin
        .from("users")
        .select("first_name, middle_name, last_name")
        .eq("id", user_id)
        .single();

      const actorName = user
        ? `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim()
        : 'Unknown';

      const newLog = {
        remarks: "Saved as draft (DRAFT)",
        date: new Date().toLocaleString(),
        action: 'DRAFT_CREATED' as const,
        actor_name: actorName
      };

      await supabaseAdmin
        .from("submissions")
        .update({ logs: [newLog] })
        .eq("submission_id", submission_id);
    }

    if (attachments) {
      const isJournalType = awardIdNum === 1;
      const attachmentsData = isJournalType
        ? { journal_attachments: attachments }
        : { book_attachments: attachments };
      
      await supabaseAdmin
        .from("submissions")
        .update(attachmentsData)
        .eq("submission_id", submission_id);
    }

    if (checklist && checklist.length > 0) {
      const { data: existingData } = await supabaseAdmin
        .from("submissions")
        .select("pdf_json_data")
        .eq("submission_id", submission_id)
        .single();
      
      const existingJson = existingData?.pdf_json_data || {};
      const updatedJson = {
        ...existingJson,
        checklist,
      };
      
      await supabaseAdmin
        .from("submissions")
        .update({ pdf_json_data: updatedJson })
        .eq("submission_id", submission_id);
    }

    return res.status(200).json({
      success: true,
      submission_id,
      is_new_draft: isNewDraft,
      message: isNewDraft ? "New draft created" : "Draft status updated to DRAFT",
    });
  } catch (err) {
    console.error("Error saving draft:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}