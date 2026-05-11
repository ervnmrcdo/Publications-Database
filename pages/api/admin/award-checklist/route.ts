import { NextApiRequest, NextApiResponse } from "next";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleClient();

  if (req.method === "GET") {
    const { type } = req.query;

    if (!type || !['JOURNAL', 'BOOK'].includes(type as string)) {
      return res.status(400).json({ error: "type query param must be 'JOURNAL' or 'BOOK'" });
    }

    const { data, error } = await supabase
      .from("award_checklist_items")
      .select("*")
      .eq("award_type", type)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ items: data });
  }

  if (req.method === "POST") {
    const { award_type, item } = req.body;

    if (!award_type || !['JOURNAL', 'BOOK'].includes(award_type)) {
      return res.status(400).json({ error: "award_type must be 'JOURNAL' or 'BOOK'" });
    }
    if (!item || typeof item !== 'string' || !item.trim()) {
      return res.status(400).json({ error: "item is required" });
    }

    const { data: maxOrder } = await supabase
      .from("award_checklist_items")
      .select("sort_order")
      .eq("award_type", award_type)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = maxOrder && maxOrder.length > 0 ? maxOrder[0].sort_order + 1 : 0;

    const { data, error } = await supabase
      .from("award_checklist_items")
      .insert([{ award_type, item: item.trim(), sort_order: nextOrder }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id) return res.status(400).json({ error: "id is required" });

    const { error } = await supabase
      .from("award_checklist_items")
      .update({ is_active: false })
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
