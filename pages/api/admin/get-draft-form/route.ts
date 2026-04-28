import { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { PDFDocument } from 'pdf-lib';

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
  const draftsBucket = 'drafts-pdf';
  const filePath = `${admin_id}/${submission_id}_form${formType}.${fileExt}`;

  try {
    const supabase = createServiceRoleClient();

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('submission_id, publication_id, award_id, submitter_id, form41_path, form42_path, form43_path, form44_path')
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

    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('first_name, middle_name, last_name, position, signature_path')
      .eq('id', admin_id)
      .single();

    if (adminError || !adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const adminName = `${adminUser.first_name || ''} ${adminUser.middle_name || ''} ${adminUser.last_name || ''}`.trim();
    const adminPosition = adminUser.position || '';
    const adminSignaturePath = adminUser.signature_path;

    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(buffer);
    } catch (loadError) {
      console.error('Failed to load PDF:', loadError);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="form${formType}.pdf"`);
      return res.send(buffer);
    }

    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const existingSignatureField = form.getButton('admin-signature_af_image');
    if (existingSignatureField) {
      try {
        const { data: signatureData, error: sigError } = await supabase.storage
          .from('signatures')
          .download(adminSignaturePath);

        if (!sigError && signatureData) {
          const signatureBuffer = await signatureData.arrayBuffer();
          const signatureImage = await pdfDoc.embedPng(signatureBuffer);
          existingSignatureField.setImage(signatureImage);
        }
      } catch (sigEmbedError) {
        console.warn('Failed to embed signature:', sigEmbedError);
      }
    }

    try {
      const nameFieldName = formType === '43' ? 'admin-name-2' : 'admin-name';
      const nameField = form.getTextField(nameFieldName);
      if (nameField) {
        nameField.setText(adminName);
      }

      const positionFieldName = formType === '43' ? 'admin-position-2' : 'admin-position';
      const positionField = form.getTextField(positionFieldName);
      if (positionField) {
        positionField.setText(adminPosition);
      }

      const dateField = form.getTextField('admin-date');
      if (dateField) {
        dateField.setText(new Date().toLocaleDateString());
      }
    } catch (fieldError) {
      console.warn('Some admin fields not found in PDF:', fieldError);
    }

    const modifiedPdfBytes = await pdfDoc.save();

    const modifiedBuffer = Buffer.from(modifiedPdfBytes);

    await supabase.storage
      .from(draftsBucket)
      .upload(filePath, modifiedBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="form${formType}.pdf"`);
    return res.send(modifiedBuffer);

  } catch (err) {
    console.error('Error in get-draft-form:', err);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
}
