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

  const fileExt = 'pdf';
  const submissionBucket = 'submissions-pdf';

  try {
    const supabase = createServiceRoleClient();

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('form41_path, form42_path, form43_path, form44_path')
      .eq('submission_id', Number(submission_id))
      .single();

    if (submissionError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionFieldMap: Record<string, string> = {
      '41': 'form41_path',
      '42': 'form42_path',
      '43': 'form43_path',
      '44': 'form44_path'
    };

    const submissionPath = submission[submissionFieldMap[formType] as keyof typeof submission];

    if (!submissionPath) {
      return res.status(404).json({ error: `Form ${formType} not found in submission` });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(submissionBucket)
      .download(submissionPath);

    if (downloadError || !fileData) {
      return res.status(404).json({ error: 'Failed to download file from submission bucket' });
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
    console.error('Error in get-pending-form:', err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}