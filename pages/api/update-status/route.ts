import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pager-server";

const ALLOWED_STATUSES = ['VALIDATED', 'PENDING_SUBMISSION', 'SUBMITTED', 'PROCESSED'];

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { submission_id, status } = req.body;

    if (!submission_id || !status) {
      return res.status(400).json({ error: "Missing submission_id or status" });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const supabase = createPagesServerClient(req, res);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('submitter_id, status')
      .eq('submission_id', submission_id)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.submitter_id !== user.id) {
      return res.status(403).json({ error: "You can only update your own submissions" });
    }

    const { data, error } = await supabase
      .from('submissions')
      .update({ status })
      .eq('submission_id', submission_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json(`Internal Server Error, ${err}`);
  }
}
