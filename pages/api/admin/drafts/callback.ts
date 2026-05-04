import { NextApiRequest, NextApiResponse } from "next";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const supabaseAdmin = createServiceRoleClient();

    const { submission_id, form_type, admin_id } = req.query;
    const body = req.body;

    if (!submission_id || !form_type || !admin_id) {
      return res
        .status(400)
        .json({ error: "submission_id, form_type, and admin_id are required" });
    }

    if (body.status === 2 || body.status === 6) {
      const resp = await fetch(body.url);
      if (!resp.ok) return res.status(500).json({ message: 'Downloading the file failed.' });

      const arrayBuffer = await resp.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const fileExt = form_type === "41" || form_type === "44" || form_type === "43" ? "pdf" : "docx";
      const bucket = fileExt === "pdf" ? "drafts-pdf" : "drafts-docx";

      const filePath = `${admin_id}/${submission_id}/form${form_type}.${fileExt}`;

      const contentType = fileExt === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.log(uploadError);
        return res.status(400).json({ error: uploadError.message });
      }

      return res
        .status(200)
        .json({ error: 0, message: "Draft saved successfully", path: uploadData.path });
    }
    return res.status(200).json({ error: 0 });
  } catch (err) {
    console.error("Error saving admin draft:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
