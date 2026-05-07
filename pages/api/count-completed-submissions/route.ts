import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pager-server";

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient(req, res);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('submission_id, status, award_id')
      .eq('submitter_id', user.id)
      .in('status', ['VALIDATED', 'SUBMITTED_TO_HIGHER_OFFICE', 'PROCESSED_BY_HIGHER_OFFICE']);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const counts = {
      total: data?.length || 0,
      validated: data?.filter((s: any) => s.status === 'VALIDATED').length || 0,
      submitted_to_higher_office: data?.filter((s: any) => s.status === 'SUBMITTED_TO_HIGHER_OFFICE').length || 0,
      processed_by_higher_office: data?.filter((s: any) => s.status === 'PROCESSED_BY_HIGHER_OFFICE').length || 0,
    };

    return res.status(200).json(counts);

  } catch (err) {
    console.error(err);
    return res.status(500).json(`Internal Server Error, ${err}`);
  }
}