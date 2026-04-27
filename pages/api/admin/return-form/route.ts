import { createPagesServerClient } from "@/lib/supabase/pager-server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextApiRequest, NextApiResponse } from "next"

export default async function ReturnAward(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const data = await req.body;
	const { admin_id, submission_id, remarks, logs } = JSON.parse(data)

	try {
		const supabase = createPagesServerClient(req, res);
		const supabaseAdmin = createServiceRoleClient();

		const { data: updateData, error } = await supabase
			.from('submissions')
			.update({
				status: 'RETURNED',
				reviewed_by_admin_id: admin_id,
				remarks: remarks,
				logs: logs
			})
			.eq('submission_id', submission_id)
			.eq('status', 'PENDING')
			.select()

		console.log(error)
		if (error) {
			return res.status(400).json({ message: error })
		}

		const pdfFiles = [
			`${admin_id}/${submission_id}/form41.pdf`,
			`${admin_id}/${submission_id}/form44.pdf`,
			`${admin_id}/${submission_id}/form43.pdf`
		];
		const docxFiles = [
			`${admin_id}/${submission_id}/form42.docx`,
		];

		await supabaseAdmin.storage.from("drafts-pdf").remove(pdfFiles);
		await supabaseAdmin.storage.from("drafts-docx").remove(docxFiles);

		return res.status(200).json(updateData);


	} catch (err) {
		console.log("Error sending signed award", err)
		return res.status(500).json(`Error submitting award', ${err}`)

	}
}
