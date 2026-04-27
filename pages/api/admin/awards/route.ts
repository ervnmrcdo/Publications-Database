import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function awardsHandler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient(req, res);

  if (req.method === "GET") {
    try {
      const { data: awards, error: awardsError } = await supabase
        .from("awards")
        .select("award_id, title, description, allowed_type")
        .order("award_id", { ascending: true });

      if (awardsError) {
        return res.status(400).json({ error: awardsError.message });
      }

      return res.status(200).json({ awards });
    } catch (err) {
      return res.status(500).json({ error: `Internal Server Error: ${err}` });
    }
  }

  if (req.method === "PUT") {
    try {
      const { award_id, allowed_type } = req.body;

      if (!award_id || !['JOURNAL', 'BOOK'].includes(allowed_type)) {
        return res.status(400).json({
          error: "Invalid request: award_id and allowed_type ('JOURNAL' or 'BOOK') are required",
        });
      }

      const { error } = await supabase
        .from("awards")
        .update({ allowed_type })
        .eq("award_id", award_id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: `Internal Server Error: ${err}` });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
