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
          awards:awards!award_id(*)
           `)
      .eq('status', 'RETURNED')
      .in('publication_id', taggedPublicationIds.length > 0 ? taggedPublicationIds : [0]);

    const dataWithUrls = data
      ? await Promise.all(
        data.map(async (r: SubmissionRow) => {
          const { submitter_id, award_id, publication_id } = r;
          const draftsBasePath = `drafts/${submitter_id}/${award_id}/${publication_id}`;

          let form41Url: string | null = null;
          let form42Url: string | null = null;
          let form43Url: string | null = null;
          let form44Url: string | null = null;

          const { data: form41SignedUrl } = await supabase.storage
            .from('drafts-pdf')
            .createSignedUrl(`${draftsBasePath}/form41.pdf`, 3600);
          form41Url = form41SignedUrl?.signedUrl || null;


          const { data: form42SignedUrl } = await supabase.storage
            .from('drafts-docx')
            .createSignedUrl(`${draftsBasePath}/form42.docx`, 3600);
          form42Url = form42SignedUrl?.signedUrl || null;

          const { data: form43SignedUrl } = await supabase.storage
            .from('drafts-docx')
            .createSignedUrl(`${draftsBasePath}/form43.docx`, 3600);
          form43Url = form43SignedUrl?.signedUrl || null;

          const { data: form44SignedUrl } = await supabase.storage
            .from('drafts-pdf')
            .createSignedUrl(`${draftsBasePath}/form44.pdf`, 3600);
          form44Url = form44SignedUrl?.signedUrl || null;

          return {
            ...r,
            form41_url: form41Url,
            form42_url: form42Url,
            form43_url: form43Url,
            form44_url: form44Url,
          };
        })
      )
      : [];

    return res.status(200).json(dataWithUrls);

  } catch (err) {
    return res.status(500).json({ message: `Internal Server Error: ${err}` });
  }
}
