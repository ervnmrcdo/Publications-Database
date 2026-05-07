import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const supabase = createPagesServerClient(req, res);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: "User profile not found" });
    }

    if (profile.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ error: "userId and newRole are required" });
    }

    if (newRole !== "teaching" && newRole !== "nonteaching") {
      return res.status(400).json({ error: "Invalid role. Only 'teaching' or 'nonteaching' allowed." });
    }

    const supabaseAdmin = createServiceRoleClient();

    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    if (targetUser.role === "admin") {
      return res.status(400).json({ error: "Cannot change role of an admin user" });
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (updateError) {
      return res.status(400).json({ error: "Failed to update user role: " + updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (err) {
    console.error("Error updating user role:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}