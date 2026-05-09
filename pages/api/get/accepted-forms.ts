import sql from '@/config/db'
import { createPagesServerClient } from '@/lib/supabase/pager-server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextApiResponse, NextApiRequest } from 'next'

export default async function RetrieveAcceptedForms(
  req: NextApiRequest, res: NextApiResponse
) {
  const { id } = JSON.parse(req.body)

  try {
    const supabase = createServiceRoleClient()

    const taggedPublicationsResult = await supabase
      .from('publication_authors')
      .select('publication_id, tagged_authors')
      .contains('tagged_authors', [id]);

    const taggedPublicationIds =
      taggedPublicationsResult.data?.map((p) => p.publication_id) || [];

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        authors:users!submitter_id(*),
        awards:awards!award_id(*),
        publications:publications!publication_id(title)
      `)
      .in('status', ['VALIDATED', 'SUBMITTED_TO_HIGHER_OFFICE', 'PROCESSED_BY_HIGHER_OFFICE'])
      .in('publication_id', taggedPublicationIds.length > 0 ? taggedPublicationIds : [0]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const dataWithUrls = data
      ? data.map((r: any) => ({
        submission_id: r.submission_id,
        first_name: r.authors?.first_name,
        last_name: r.authors?.last_name,
        date_submitted: r.date_submitted,
        award_title: r.awards?.title,
        publication_title: r.publications?.title,
        logs: r.logs,
        status: r.status,
        attached_files: r.attached_files,
        form41_path: r.form41_path,
        form42_path: r.form42_path,
        form43_path: r.form43_path,
        form44_path: r.form44_path,
        journal_attachments: r.journal_attachments ?? {},
        book_attachments: r.book_attachments ?? {}, 
      }))
      : [];

    return res.status(200).json(dataWithUrls);

  } catch (err) {
    return res.status(500).json(`Internal Server error: ${err}`)
  }
}
