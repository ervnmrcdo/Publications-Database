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

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (userId === user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const supabaseAdmin = createServiceRoleClient();

    await supabaseAdmin
      .from("submission_author_approvals")
      .delete()
      .eq("user_id", userId);

    await supabaseAdmin
      .from("publication_authors")
      .delete()
      .eq("user_id", userId);

    const { data: userSubmissions } = await supabaseAdmin
      .from("submissions")
      .select("submission_id")
      .or(`submitter_id.eq.${userId},reviewed_by_admin_id.eq.${userId}`);

    if (userSubmissions && userSubmissions.length > 0) {
      const submissionIds = userSubmissions.map((s) => s.submission_id);

      await supabaseAdmin
        .from("publication_award_applications")
        .delete()
        .in("submission_id", submissionIds);
    }

    await supabaseAdmin
      .from("submissions")
      .delete()
      .eq("submitter_id", userId);

    await supabaseAdmin
      .from("submissions")
      .delete()
      .eq("reviewed_by_admin_id", userId);

    await supabaseAdmin
      .from("publications")
      .update({ tagged_authors: [] })
      .contains("tagged_authors", [userId]);

    const { error: deleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      return res.status(400).json({ error: "Failed to delete user: " + deleteError.message });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}