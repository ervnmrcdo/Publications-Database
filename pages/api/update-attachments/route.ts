import { NextApiRequest, NextApiResponse } from "next";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { submission_id, journal_attachments, book_attachments } = req.body;

    if (!submission_id) {
      return res.status(400).json({ error: "submission_id is required" });
    }

    const supabaseAdmin = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};

    if (journal_attachments) {
      updateData.journal_attachments = journal_attachments;
    }
    
    if (book_attachments) {
      updateData.book_attachments = book_attachments;
    }

    const { error: updateError } = await supabaseAdmin
      .from("submissions")
      .update(updateData)
      .eq("submission_id", submission_id);

    if (updateError) {
      return res.status(400).json({ error: "Failed to update attachments: " + updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: "Attachments updated successfully",
    });
  } catch (err) {
    console.error("Error updating attachments:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}