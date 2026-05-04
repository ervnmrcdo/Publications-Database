import { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { submission_id, form_type } = req.query;

  if (!submission_id) {
    return res.status(400).json({ error: 'submission_id is required' });
  }

  if (!form_type) {
    return res.status(400).json({ error: 'form_type is required' });
  }

  const validFormTypes = ['41', '42', '43', '44'];
  const formType = String(form_type);

  if (!validFormTypes.includes(formType)) {
    return res.status(400).json({ error: 'Invalid form_type. Must be 41, 42, 43, or 44' });
  }

  const isDocxForm = formType === '42';
  const fileExt = isDocxForm ? 'docx' : 'pdf';
  const submissionBucket = isDocxForm ? 'submissions-docx' : 'submissions-pdf';

  try {
    const supabase = createServiceRoleClient();

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('form41_path, form42_path, form43_path, form44_path')
      .eq('submission_id', Number(submission_id))
      .single();

    if (submissionError || !submission) {
      return res.status(404).json({ error: 'Submission not found', code: 'SUBMISSION_NOT_FOUND' });
    }

    const submissionFieldMap: Record<string, string> = {
      '41': 'form41_path',
      '42': 'form42_path',
      '43': 'form43_path',
      '44': 'form44_path'
    };

    const submissionPath = submission[submissionFieldMap[formType] as keyof typeof submission];

    if (!submissionPath) {
      const availableForms: string[] = [];
      if (submission.form41_path) availableForms.push('form41');
      if (submission.form42_path) availableForms.push('form42');
      if (submission.form43_path) availableForms.push('form43');
      if (submission.form44_path) availableForms.push('form44');
      
      return res.status(404).json({ 
        error: `Form ${formType} was not processed during admin validation. The file may not have been uploaded.`,
        code: 'FORM_PATH_NULL',
        formType: formType,
        availableForms
      });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(submissionBucket)
      .download(submissionPath);

    if (downloadError || !fileData) {
      return res.status(404).json({ 
        error: `Form ${formType} file exists in database but failed to download from storage: ${downloadError?.message || 'Unknown error'}`,
        code: 'FILE_DOWNLOAD_FAILED',
        storagePath: submissionPath
      });
    }

    const fileBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const contentType = fileExt === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="form${formType}.${fileExt}"`);
    return res.send(buffer);

  } catch (err) {
    console.error('Error in get-validated-form:', err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}