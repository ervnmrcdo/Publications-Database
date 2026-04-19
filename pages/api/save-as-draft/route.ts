import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { publicationId, awardId, user_id } = req.body;

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