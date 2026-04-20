import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { submission_id, newLogs, publicationId, awardId, submitterId } = req.body;

    if (!submission_id || !publicationId || !awardId || !submitterId) {
      return res.status(400).json({ error: "submission_id, publicationId, awardId, and submitterId are required" });
    }

    const supabaseAdmin = createServiceRoleClient();

    const formTypes = [
      { type: "41", ext: "pdf", bucket: "drafts-pdf" },
      { type: "42", ext: "docx", bucket: "drafts-docx" },
      { type: "43", ext: "docx", bucket: "drafts-docx" },
      { type: "44", ext: "pdf", bucket: "drafts-pdf" },
    ];

    const formPaths: Record<string, string> = {};

    for (const form of formTypes) {
      const draftPath = `${submission_id}_form${form.type}.${form.ext}`;
      const submissionPath = `submissions/${submission_id}_form${form.type}.${form.ext}`;
      const targetBucket = form.ext === "pdf" ? "submissions-pdf" : "submissions-docx";

      try {
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
          .from(form.bucket)
          .createSignedUrl(draftPath, 60);

        if (signedUrlError || !signedUrlData?.signedUrl) {
          console.log(`No draft found for form ${form.type}`);
          continue;
        }

        const fileResponse = await fetch(signedUrlData.signedUrl);
        if (!fileResponse.ok) {
          console.log(`Failed to fetch draft for form ${form.type}`);
          continue;
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
          .from(targetBucket)
          .upload(submissionPath, fileBuffer, {
            contentType: form.ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            upsert: true,
          });

        if (uploadError) {
          console.log(`Error uploading form ${form.type}:`, uploadError);
          continue;
        }

        const fieldName = `form${form.type}_path`;
        formPaths[fieldName] = submissionPath;
      } catch (err) {
        console.log(`Error processing form ${form.type}:`, err);
      }
    }

    const supabase = createPagesServerClient(req, res);
    const updateData: Record<string, unknown> = {
      status: 'PENDING',
      logs: newLogs,
    };

    if (formPaths.form41_path) updateData.form41_path = formPaths.form41_path;
    if (formPaths.form42_path) updateData.form42_path = formPaths.form42_path;
    if (formPaths.form43_path) updateData.form43_path = formPaths.form43_path;
    if (formPaths.form44_path) updateData.form44_path = formPaths.form44_path;

    const { data, error } = await supabase
      .from('submissions')
      .update(updateData)
      .eq('submission_id', submission_id)
      .eq('status', 'RETURNED')
      .select()

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Error resubmitting from drafts:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
