import { NextApiRequest, NextApiResponse } from "next"
import { createPagesServerClient } from "@/lib/supabase/pager-server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export default async function ValidateAward(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const data = await req.body;
	const { admin_id, submission_id, newLogs } = data

	try {
		const supabaseAdmin = createServiceRoleClient();

		const updateData: Record<string, any> = {
			status: 'VALIDATED',
			reviewed_by_admin_id: admin_id,
			logs: newLogs
		};

		const draftsPdfFiles = [
			`${admin_id}/${submission_id}/form41.pdf`,
			`${admin_id}/${submission_id}/form44.pdf`,
			`${admin_id}/${submission_id}/form43.pdf`
		];
		const draftsDocxFiles = [
			`${admin_id}/${submission_id}/form42.docx`,
		];

		const { data: pdfList, error: pdfListError } = await supabaseAdmin.storage
			.from("drafts-pdf")
			.list(`${admin_id}/${submission_id}`, {
				limit: 10
			});

		if (!pdfListError && pdfList && pdfList.length > 0) {
			for (const file of pdfList) {
				const fileName = file.name;
				const formType = fileName.replace('.pdf', '').replace('form', '');

				const { data: fileData, error: downloadError } = await supabaseAdmin.storage
					.from("drafts-pdf")
					.download(`${admin_id}/${submission_id}/${fileName}`);

				if (!downloadError && fileData) {
					const fileBuffer = Buffer.from(await fileData.arrayBuffer());
					const uploadFileName = `${submission_id}-form${formType}.pdf`;

					const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
						.from('submissions-pdf')
						.upload(uploadFileName, fileBuffer, {
							contentType: 'application/pdf',
							upsert: true
						});

					if (!uploadError) {
						updateData[`form${formType}_path`] = uploadData.path;
					}
				}
			}
		}

		const { data: docxList, error: docxListError } = await supabaseAdmin.storage
			.from("drafts-docx")
			.list(`${admin_id}/${submission_id}`, {
				limit: 10
			});

		if (!docxListError && docxList && docxList.length > 0) {
			for (const file of docxList) {
				const fileName = file.name;
				const formType = fileName.replace('.docx', '').replace('form', '');

				const { data: fileData, error: downloadError } = await supabaseAdmin.storage
					.from("drafts-docx")
					.download(`${admin_id}/${submission_id}/${fileName}`);

				if (!downloadError && fileData) {
					const fileBuffer = Buffer.from(await fileData.arrayBuffer());
					const uploadFileName = `${submission_id}-form${formType}.docx`;

					const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
						.from('submissions-docx')
						.upload(uploadFileName, fileBuffer, {
							contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
							upsert: true
						});

					if (!uploadError) {
						updateData[`form${formType}_path`] = uploadData.path;
					}
				}
			}
		}

		const { data: updateResult, error: updateError } = await supabaseAdmin
			.from('submissions')
			.update(updateData)
			.eq('submission_id', submission_id)
			.eq('status', 'PENDING')
			.select();

		if (updateError) {
			return res.status(400).json({ error: updateError.message });
		}

		await supabaseAdmin.storage.from("drafts-pdf").remove(draftsPdfFiles);
		await supabaseAdmin.storage.from("drafts-docx").remove(draftsDocxFiles);

		return res.status(200).json(updateResult);

	} catch (err) {
		console.log("Error sending signed award", err)
		return res.status(500).json(`Error submitting award', ${err}`)

	}
}
