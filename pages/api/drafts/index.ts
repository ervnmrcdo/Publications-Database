import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUser = createPagesServerClient(req, res);
  const supabase = createServiceRoleClient();

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    return handleGet(req, res, supabase, user.id);
  } else if (req.method === "DELETE") {
    return handleDelete(req, res, supabase, user.id);
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  userId: string
) {
  const { publicationId, awardId } = req.query;
 
  if (!publicationId || !awardId) {
    return res
      .status(400)
      .json({ error: "publicationId and awardId are required" });
  }

  // Fetch existing draft to get checklist from pdf_json_data
  const { data: existingDraft } = await supabase
    .from("submissions")
    .select("pdf_json_data")
    .eq("publication_id", Number(publicationId))
    .eq("award_id", Number(awardId))
    .in("status", ["DRAFT", "RETURNED"])
    .single();

  const savedChecklist = existingDraft?.pdf_json_data?.checklist || [];

  const basePath = `${userId}/${awardId}/${publicationId}`;
  const tempPath = `${userId}_${publicationId}_${awardId}_form`;

  const { data: pdfFiles } = await supabase.storage
    .from("drafts-pdf")
    .list(basePath, { limit: 10 });


  const { data: docxFiles } = await supabase.storage
    .from("drafts-docx")
    .list(basePath, { limit: 10 });


  const draftUrls: Record<string, string | null> = {};
  const draftPaths: Record<string, string | null> = {};

  const pdfBucket = supabase.storage.from("drafts-pdf");
  const docxBucket = supabase.storage.from("drafts-docx");

  for (const file of pdfFiles || []) {
    const path = `${basePath}/${file.name}`;
    const { data: urlData } = await pdfBucket.createSignedUrl(path, 3600);
    const formType = file.name.replace(".pdf", "");
    draftUrls[formType] = urlData?.signedUrl || null;
    draftPaths[`${formType}_path`] = path;
  }

  for (const file of docxFiles || []) {
    const path = `${basePath}/${file.name}`;
    const { data: urlData } = await docxBucket.createSignedUrl(path, 3600);
    const formType = file.name.replace(".docx", "");
    draftUrls[formType] = urlData?.signedUrl || null;
    draftPaths[`${formType}_path`] = path;
  }

  // Check temp PDF files individually
  if (!draftPaths.form41_path) {
    const tempFile = `${tempPath}41.pdf`;
    try {
      const { data: urlData } = await pdfBucket.createSignedUrl(tempFile, 3600);
      if (urlData?.signedUrl) {
        draftUrls.form41 = urlData.signedUrl;
        draftPaths.form41_path = tempFile;
      }
    } catch (e) {
      // File doesn't exist, skip
    }
  }

  if (!draftPaths.form44_path) {
    const tempFile = `${tempPath}44.pdf`;
    try {
      const { data: urlData } = await pdfBucket.createSignedUrl(tempFile, 3600);
      if (urlData?.signedUrl) {
        draftUrls.form44 = urlData.signedUrl;
        draftPaths.form44_path = tempFile;
      }
    } catch (e) {
      // File doesn't exist, skip
    }
  }

  // Check temp DOCX files individually
  if (!draftPaths.form42_path) {
    const tempFile = `${tempPath}42.docx`;
    try {
      const { data: urlData } = await docxBucket.createSignedUrl(tempFile, 3600);
      if (urlData?.signedUrl) {
        draftUrls.form42 = urlData.signedUrl;
        draftPaths.form42_path = tempFile;
      }
    } catch (e) {
      // File doesn't exist, skip
    }
  }

  if (!draftPaths.form43_path) {
    const tempFile = `${tempPath}43.pdf`;
    try {
      const { data: urlData } = await pdfBucket.createSignedUrl(tempFile, 3600);
      if (urlData?.signedUrl) {
        draftUrls.form43 = urlData.signedUrl;
        draftPaths.form43_path = tempFile;
      }
    } catch (e) {
      // File doesn't exist, skip
    }
  }

  return res.status(200).json({
    publication_id: Number(publicationId),
    award_id: Number(awardId),
    ...draftPaths,
    ...draftUrls,
    checklist: savedChecklist,
  });
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  userId: string
) {
  try {
    const { publicationId, awardId } = req.query;

    if (!publicationId || !awardId) {
      return res
        .status(400)
        .json({ error: "publicationId and awardId are required" });
    }

    const basePath = `${userId}/${awardId}/${publicationId}`;

    const pdfFiles = [
      `${basePath}/form41.pdf`,
      `${basePath}/form44.pdf`,
      `${basePath}/form43.pdf`,
    ];

    const docxFiles = [
      `${basePath}/form42.docx`,
    ];

    const tempPdfFiles = [
      `${userId}_${publicationId}_${awardId}_form41.pdf`,
      `${userId}_${publicationId}_${awardId}_form44.pdf`,
      `${userId}_${publicationId}_${awardId}_form43.pdf`,
    ];

    const tempDocxFiles = [
      `${userId}_${publicationId}_${awardId}_form42.docx`,
    ];

    await supabase.storage.from("drafts-pdf").remove([...pdfFiles, ...tempPdfFiles]);
    await supabase.storage.from("drafts-docx").remove([...docxFiles, ...tempDocxFiles]);

    return res.status(200).json({ message: "Draft deleted successfully" });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Error deleting draft" });
  }

}
