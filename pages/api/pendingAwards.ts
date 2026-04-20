import sql from "@/config/db";
import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export default async function PendingAwards(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {

    const supabase = createServiceRoleClient();

    let id = null;
    let filterByUser = false;
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      id = body?.id;
      filterByUser = true;
    }

    let query = supabase
      .from('submissions')
      .select(`
        *,
        authors:users!submitter_id(*),
        awards:awards!award_id(*),
        publications:publications!publication_id(*)
       `)
      .eq('status', 'PENDING');

    if (filterByUser && id) {
      query = query.eq('submitter_id', id);
    }

    const { data, error } = await query;


    if (error) {
      return res.status(400).json({ message: `Internal server error: ${error}` })
    }


    const formatted = await Promise.all(data.map(async (r: any) => {
      let form41Url = null;
      let form42Url = null;
      let form43Url = null;
      let form44Url = null;

      // Get signed URL for Form 4.1 PDF from Supabase Storage
      if (r.form41_path) {
        console.log(r.form41_path)
        const { data: signedUrlData, error: errorLog } = await supabase.storage
          .from('submissions-pdf')
          .createSignedUrl(r.form41_path, 3600); // 1 hour expiry
        form41Url = signedUrlData?.signedUrl || null;
      }


      // Get signed URLs for DOCX files
      if (r.form42_path) {
        const { data: form42SignedUrl } = await supabase.storage
          .from('submissions-docx')
          .createSignedUrl(r.form42_path, 3600);
        form42Url = form42SignedUrl?.signedUrl || null;
      }

      if (r.form43_path) {
        const { data: form43SignedUrl } = await supabase.storage
          .from('submissions-docx')
          .createSignedUrl(r.form43_path, 3600);
        form43Url = form43SignedUrl?.signedUrl || null;
      }

      if (r.form44_path) {
        const { data: form44SignedUrl } = await supabase.storage
          .from('submissions-pdf')
          .createSignedUrl(r.form44_path, 3600);
        form44Url = form44SignedUrl?.signedUrl || null;
      }

      return {
        id: r.submission_id,
        name: `${r.authors.first_name} ${r.authors.last_name}`,
        publicationTitle: r.publications?.title,
        dateSubmitted: r.date_submitted,
        status: r.status,
        awardId: r.awards.award_id,
        pdfBase64: null,
        awardTitle: r.awards.title,
        logs: r.logs,
        form41Url,
        form42Url,
        form43Url,
        form44Url,
        journal_attachments: r.journal_attachments ?? {},
        book_attachments: r.book_attachments ?? {}, 
      };
    }));



    return res.status(200).json(formatted);

  } catch (error) {
    console.error("Error fetching pending awards:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
