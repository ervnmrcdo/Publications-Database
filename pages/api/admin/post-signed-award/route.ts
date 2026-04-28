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

		// Get submission details for PDF regeneration
		const { data: submission, error: subError } = await supabaseAdmin
			.from('submissions')
			.select('publication_id, award_id, submitter_id')
			.eq('submission_id', submission_id)
			.single();

		const baseUrl = 'http://localhost:3000';

		// PDF forms that need regeneration with admin fields
		const pdfFormTypes = ['41', '43', '44'];

		// Try to regenerate PDFs with admin fields
		for (const formType of pdfFormTypes) {
			try {
				const generateUrl = `${baseUrl}/api/generate-form/ipa-${formType}?publicationId=${submission?.publication_id}&awardId=${submission?.award_id}&user_id=${submission?.submitter_id}&adminId=${admin_id}`;
				
				const response = await fetch(generateUrl);
				
				if (response.ok) {
					const regeneratedPdf = await response.arrayBuffer();
					const fileBuffer = Buffer.from(regeneratedPdf);
					const uploadFileName = `${submission_id}-form${formType}.pdf`;

					const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
						.from('submissions-pdf')
						.upload(uploadFileName, fileBuffer, {
							contentType: 'application/pdf',
							upsert: true
						});

					if (!uploadError && uploadData) {
						updateData[`form${formType}_path`] = uploadData.path;
						console.log(`Successfully regenerated and saved form ${formType} with admin fields`);
					} else {
						console.warn(`Failed to upload regenerated form ${formType}:`, uploadError);
					}
				} else {
					console.warn(`Failed to regenerate form ${formType}:`, response.status);
				}
			} catch (regenError) {
				console.warn(`Error regenerating form ${formType}:`, regenError);
			}
		}

		// Handle DOCX files (form 42) - no regeneration needed
		const draftsDocxFiles = [
			`${admin_id}/${submission_id}/form42.docx`,
		];

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

		// Clean up drafts
		const draftsPdfFiles = [
			`${admin_id}/${submission_id}/form41.pdf`,
			`${admin_id}/${submission_id}/form43.pdf`,
			`${admin_id}/${submission_id}/form44.pdf`
		];
		await supabaseAdmin.storage.from("drafts-pdf").remove(draftsPdfFiles);
		await supabaseAdmin.storage.from("drafts-docx").remove(draftsDocxFiles);

		return res.status(200).json(updateResult);

	} catch (err) {
		console.log("Error sending signed award", err)
		return res.status(500).json(`Error submitting award', ${err}`)

	}
}
