import { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { submission_id, form_type, admin_id } = req.query;

  if (!submission_id) {
    return res.status(400).json({ error: 'submission_id is required' });
  }

  if (!form_type) {
    return res.status(400).json({ error: 'form_type is required' });
  }

  if (!admin_id) {
    return res.status(400).json({ error: 'admin_id is required' });
  }

  const validFormTypes = ['41', '42', '43', '44'];
  const formType = String(form_type);

  if (!validFormTypes.includes(formType)) {
    return res.status(400).json({ error: 'Invalid form_type. Must be 41, 42, 43, or 44' });
  }

  const fileExt = 'pdf';
  const bucket = 'drafts-pdf';
  const filePath = `${submission_id}_form${formType}.${fileExt}`;

  try {
    const supabase = createServiceRoleClient();

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('publication_id, award_id, form41_path, form42_path, form43_path, form44_path')
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

    const submissionBucket = 'submissions-pdf';

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(submissionBucket)
      .download(submissionPath);

    if (downloadError || !fileData) {
      return res.status(404).json({ error: 'Failed to download file from submission bucket' });
    }

    const fileBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    if (formType === '42') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `inline; filename="form${formType}.docx"`);
      return res.send(buffer);
    }

    const generateFormUrl = `http://localhost:3000/api/generate-form/ipa-${formType}?publicationId=${submission.publication_id}&awardId=${submission.award_id}&user_id=${admin_id}&adminId=${admin_id}`;
    
    try {
      const response = await fetch(generateFormUrl);
      if (response.ok) {
        const regeneratedPdf = await response.arrayBuffer();
        const regeneratedBuffer = Buffer.from(regeneratedPdf);
        
        await supabase.storage
          .from(bucket)
          .upload(filePath, regeneratedBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="form${formType}.pdf"`);
        return res.send(regeneratedBuffer);
      }
    } catch (generateError) {
      console.warn('Failed to regenerate PDF with admin fields, returning stored version:', generateError);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="form${formType}.pdf"`);
    return res.send(buffer);

  } catch (err) {
    console.error('Error in get-draft-form:', err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
