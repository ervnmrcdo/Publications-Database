import { NextApiRequest, NextApiResponse } from "next"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export default async function SignAndSubmit(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const data = await req.body;
	const { admin_id, submission_id, newLogs } = data;

	if (!admin_id || !submission_id || !newLogs) {
		return res.status(400).json({ error: "admin_id, submission_id, and newLogs are required" });
	}

	try {
		const supabaseAdmin = createServiceRoleClient();

		const updateData: Record<string, any> = {
			status: 'VALIDATED',
			reviewed_by_admin_id: admin_id,
			logs: newLogs
		};

		const formTypes = [
			{ type: '41', ext: 'pdf', bucket: 'submissions-pdf', draftsBucket: 'drafts-pdf' },
			{ type: '42', ext: 'docx', bucket: 'submissions-docx', draftsBucket: 'drafts-docx' },
			{ type: '43', ext: 'pdf', bucket: 'submissions-pdf', draftsBucket: 'drafts-pdf' },
			{ type: '44', ext: 'pdf', bucket: 'submissions-pdf', draftsBucket: 'drafts-pdf' },
		];

		const results: Record<string, { success: boolean; error?: string }> = {};

		// Process each form type
		for (const form of formTypes) {
			const { type, ext, bucket: submissionBucket, draftsBucket } = form;
			const draftPath = `${admin_id}/${submission_id}/form${type}.${ext}`;
			const uploadFileName = `${submission_id}-form${type}.${ext}`;

			try {
				// Download from drafts
				const { data: draftData, error: downloadError } = await supabaseAdmin.storage
					.from(draftsBucket)
					.download(draftPath);

				if (downloadError || !draftData) {
					results[`form${type}`] = { 
						success: false, 
						error: `Draft not found: ${downloadError?.message || 'Unknown error'}` 
					};
					continue;
				}

				const fileBuffer = Buffer.from(await draftData.arrayBuffer());

				const contentType = ext === 'pdf'
					? 'application/pdf'
					: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

				// Upload to submissions bucket
				const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
					.from(submissionBucket)
					.upload(uploadFileName, fileBuffer, {
						contentType,
						upsert: true
					});

				if (uploadError || !uploadData) {
					results[`form${type}`] = { 
						success: false, 
						error: `Upload failed: ${uploadError?.message || 'Unknown error'}` 
					};
					continue;
				}

				// Update form path in database
				updateData[`form${type}_path`] = uploadData.path;
				results[`form${type}`] = { success: true };

			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : String(err);
				results[`form${type}`] = { success: false, error: errorMsg };
			}
		}

		// Check for critical failures
		const failedForms = Object.entries(results)
			.filter(([, result]) => !result.success)
			.map(([form, result]) => `${form}: ${result.error}`);

		// Perform database update
		const { data: updateResult, error: updateError } = await supabaseAdmin
			.from('submissions')
			.update(updateData)
			.eq('submission_id', submission_id)
			.eq('status', 'PENDING')
			.select();

		if (updateError) {
			return res.status(400).json({ 
				error: updateError.message,
				results
			});
		}

		// Clean up drafts after successful database update
		const draftsPdfFiles = [
			`${admin_id}/${submission_id}/form41.pdf`,
			`${admin_id}/${submission_id}/form43.pdf`,
			`${admin_id}/${submission_id}/form44.pdf`
		];
		const draftsDocxFiles = [
			`${admin_id}/${submission_id}/form42.docx`
		];

		await supabaseAdmin.storage.from("drafts-pdf").remove(draftsPdfFiles);
		await supabaseAdmin.storage.from("drafts-docx").remove(draftsDocxFiles);

		// Return success with results
		return res.status(200).json({
			...updateResult,
			results,
			failedForms: failedForms.length > 0 ? failedForms : undefined
		});

	} catch (err) {
		console.error("Error in sign-and-submit:", err);
		return res.status(500).json(`Error submitting award: ${err}`);
	}
}