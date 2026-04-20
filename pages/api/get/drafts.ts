import { NextApiRequest, NextApiResponse } from "next";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id } = JSON.parse(req.body);

    if (!id) {
      return res.status(400).json({ error: "userId is required" });
    }

    const supabaseAdmin = createServiceRoleClient();

    const taggedPublicationsResult = await supabaseAdmin
      .from("publication_authors")
      .select("publication_id, tagged_authors")
      .contains("tagged_authors", [id]);

    const taggedPublicationIds =
      taggedPublicationsResult.data?.map((p) => p.publication_id) || [];

    const submissions = await supabaseAdmin
      .from("submissions")
      .select(`
        *,
        authors:users!submitter_id(*),
        awards:awards!award_id(*),
        publications:publications!publication_id(*)
      `)
      .eq("status", "DRAFT")
      .in("publication_id", taggedPublicationIds.length > 0 ? taggedPublicationIds : [0])
      .order("date_submitted", { ascending: false });

    const allSubmissions = await supabaseAdmin
      .from("submissions")
      .select(`
        *,
        authors:users!submitter_id(*),
        awards:awards!award_id(*),
        publications:publications!publication_id(*)
      `)
      .eq("status", "DRAFT")
      .eq("submitter_id", id)
      .order("date_submitted", { ascending: false });

    const combinedSubmissions = [...(submissions.data || []), ...(allSubmissions.data || [])];

    const uniqueSubmissions = combinedSubmissions.filter(
      (v, i, a) => a.findIndex((t) => t.submission_id === v.submission_id) === i
    );

    const dataWithUrls = await Promise.all(
      uniqueSubmissions.map(async (r: any) => {
        const submissionId = r.submission_id;
        const { award_id, publication_id } = r;

        const { data: pubAuthors } = await supabaseAdmin
          .from("publication_authors")
          .select("*, users!user_id(id, first_name, last_name)")
          .eq("publication_id", publication_id);

        const taggedAuthorsList = pubAuthors?.map((a: any) => ({
          id: a.users?.id,
          first_name: a.users?.first_name,
          last_name: a.users?.last_name,
        })) || [];

        const form41Path = r.form41_path || `${submissionId}_form41.pdf`;
        const form42Path = r.form42_path || `${submissionId}_form42.docx`;
        const form43Path = r.form43_path || `${submissionId}_form43.docx`;
        const form44Path = r.form44_path || `${submissionId}_form44.pdf`;

        let form41Url: string | null = null;
        let form42Url: string | null = null;
        let form43Url: string | null = null;
        let form44Url: string | null = null;

        const { data: form41SignedUrl } = await supabaseAdmin.storage
          .from("drafts-pdf")
          .createSignedUrl(form41Path, 3600);
        form41Url = form41SignedUrl?.signedUrl || null;

        const { data: form42SignedUrl } = await supabaseAdmin.storage
          .from("drafts-docx")
          .createSignedUrl(form42Path, 3600);
        form42Url = form42SignedUrl?.signedUrl || null;

        const { data: form43SignedUrl } = await supabaseAdmin.storage
          .from("drafts-docx")
          .createSignedUrl(form43Path, 3600);
        form43Url = form43SignedUrl?.signedUrl || null;

        const { data: form44SignedUrl } = await supabaseAdmin.storage
          .from("drafts-pdf")
          .createSignedUrl(form44Path, 3600);
        form44Url = form44SignedUrl?.signedUrl || null;

        return {
          ...r,
          publication_title: r.publications?.title,
          tagged_authors: taggedAuthorsList,
          form41_url: form41Url,
          form42_url: form42Url,
          form43_url: form43Url,
          form44_url: form44Url,
          journal_attachments: r.journal_attachments ?? {},
          book_attachments: r.book_attachments ?? {},
        };
      })
    );

    return res.status(200).json(dataWithUrls || []);
  } catch (err) {
    console.error("Error fetching drafts:", err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
