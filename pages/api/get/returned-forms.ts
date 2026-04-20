import { createPagesServerClient } from '@/lib/supabase/pager-server'
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { NextApiResponse, NextApiRequest } from 'next'

interface SubmissionRow {
  submission_id: number;
  submitter_id: string;
  award_id: number;
  publication_id: number;
  status: string;
  [key: string]: unknown;
}

export default async function RetrieveReturnedForms(
  req: NextApiRequest, res: NextApiResponse
): Promise<void> {
  const { id } = JSON.parse(req.body)

  try {
    const supabase = createServiceRoleClient();

    const taggedPublicationsResult = await supabase
      .from('publication_authors')
      .select('publication_id, tagged_authors')
      .contains('tagged_authors', [id]);

    const taggedPublicationIds =
      taggedPublicationsResult.data?.map((p) => p.publication_id) || [];

    const { data } = await supabase.from('submissions')
      .select(`
          *,
          authors:users!submitter_id(*),
          awards:awards!award_id(*),
          publications:publications!publication_id(*)
           `)
      .eq('status', 'RETURNED')
      .in('publication_id', taggedPublicationIds.length > 0 ? taggedPublicationIds : [0]);

    const dataWithUrls = data
      ? await Promise.all(
        data.map(async (r: SubmissionRow) => {
          const submissionId = r.submission_id;
          const publicationId = r.publication_id;

          const { data: pubAuthors } = await supabase
            .from('publication_authors')
            .select('*, users!user_id(id, first_name, last_name)')
            .eq('publication_id', publicationId);

          const taggedAuthorsList = pubAuthors?.map((a: any) => ({
            id: a.users?.id,
            first_name: a.users?.first_name,
            last_name: a.users?.last_name,
          })) || [];

          let form41Url: string | null = null;
          let form42Url: string | null = null;
          let form43Url: string | null = null;
          let form44Url: string | null = null;

          const { data: form41SignedUrl } = await supabase.storage
            .from('drafts-pdf')
            .createSignedUrl(`${submissionId}_form41.pdf`, 3600);
          form41Url = form41SignedUrl?.signedUrl || null;


          const { data: form42SignedUrl } = await supabase.storage
            .from('drafts-docx')
            .createSignedUrl(`${submissionId}_form42.docx`, 3600);
          form42Url = form42SignedUrl?.signedUrl || null;

          const { data: form43SignedUrl } = await supabase.storage
            .from('drafts-docx')
            .createSignedUrl(`${submissionId}_form43.docx`, 3600);
          form43Url = form43SignedUrl?.signedUrl || null;

          const { data: form44SignedUrl } = await supabase.storage
            .from('drafts-pdf')
            .createSignedUrl(`${submissionId}_form44.pdf`, 3600);
          form44Url = form44SignedUrl?.signedUrl || null;

          return {
            ...r,
            publication_title: (r.publications as any)?.title,
            tagged_authors: taggedAuthorsList,
            form41_url: form41Url,
            form42_url: form42Url,
            form43_url: form43Url,
            form44_url: form44Url,
            journal_attachments: r.journal_attachments ?? {},
            book_attachments: r.book_attachments ?? {},
          };
        })
      )
      : [];

    return res.status(200).json(dataWithUrls);

  } catch (err) {
    return res.status(500).json({ message: `Internal Server Error: ${err}` });
  }
}
