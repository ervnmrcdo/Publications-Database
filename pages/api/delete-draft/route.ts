import { NextApiRequest, NextApiResponse } from "next";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { submission_id } = req.body;

    if (!submission_id) {
      return res.status(400).json({ error: "submission_id is required" });
    }

    const supabaseAdmin = createServiceRoleClient();

    const { error: deletePubAwardError } = await supabaseAdmin
      .from("publication_award_applications")
      .delete()
      .eq("publication_id", req.body.publicationId)
      .eq("award_id", req.body.awardId);

    if (deletePubAwardError) {
      return res.status(400).json({ error: "Failed to delete publication award application: " + deletePubAwardError.message });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("submissions")
      .delete()
      .eq("submission_id", submission_id);

    if (deleteError) {
      return res.status(400).json({ error: "Failed to delete draft: " + deleteError.message });
    }

    const submissionId = Number(submission_id);

    await supabaseAdmin.storage
      .from("drafts-pdf")
      .remove([
        `${submissionId}_form41.pdf`,
        `${submissionId}_form44.pdf`,
        `${submissionId}_form43.pdf`,
      ]);

    await supabaseAdmin.storage
      .from("drafts-docx")
      .remove([
        `${submissionId}_form42.docx`,
      ]);

    return res.status(200).json({
      success: true,
      message: "Draft deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting draft:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}