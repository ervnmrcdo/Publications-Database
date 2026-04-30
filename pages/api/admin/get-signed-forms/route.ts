import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@/lib/supabase/pager-server'

export default async function GetSignedForms(
	req: NextApiRequest, res: NextApiResponse
) {
	const { adminId } = JSON.parse(req.body)

	console.log('Fetching signed forms for admin:', adminId)

	try {
		const supabase = createPagesServerClient(req, res);

		const { data, error } = await supabase
			.from('submissions')
			.select(`
				*,
				authors:users!submitter_id(first_name, last_name),
				awards:awards!award_id(title),
				publications:publications!publication_id(title)
			`)
.eq('reviewed_by_admin_id', adminId)
		.in('status', ['VALIDATED', 'PENDING_SUBMISSION', 'SUBMITTED', 'PROCESSED'])
		.order('date_submitted', { ascending: false });

		if (error) {
			console.log(error)
			return res.status(400).json({ error: error.message });
		}

		const dataWithUrls = data
			? await Promise.all(
				data.map(async (r: any) => {
					let pdfUrl = null;

					if (r.attached_file_path) {
						const { data: signedUrlData } = await supabase.storage
							.from('submissions-documents')
							.createSignedUrl(r.attached_file_path, 3600);

						pdfUrl = signedUrlData?.signedUrl || null;
					}

					return {
						submission_id: r.submission_id,
						first_name: r.authors?.first_name,
						last_name: r.authors?.last_name,
						date_submitted: r.date_submitted,
						title: r.awards?.title,
						publication_title: r.publications?.title,
						logs: r.logs,
						status: r.status,
						form41Url: r.form41_path ? true : null,
						form42Url: r.form42_path ? true : null,
						form43Url: r.form43_path ? true : null,
						form44Url: r.form44_path ? true : null,
						pdfUrl,
						attached_files: r.attached_files,
					};
				})
			)
			: [];

		return res.status(200).json(dataWithUrls);

	} catch (err) {
		return res.status(500).json(`Internal Server error: ${err}`)
	}
}
