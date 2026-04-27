import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { createPagesServerClient } from '@/lib/supabase/pager-server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { publicationId, awardId, user_id } = req.query;

  if (!publicationId) {
    return res.status(400).json({ message: 'publicationId is required' });
  }

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  const awardIdNum = Number(awardId);
  if (!awardId || (awardIdNum !== 1 && awardIdNum !== 2)) {
    return res.status(400).json({ message: 'awardId must be 1 or 2 for form 4.3' });
  }

  try {
    const supabase = createPagesServerClient(req, res);
    const supabaseAdmin = createServiceRoleClient();

    const { data: existingDraft } = await supabaseAdmin
      .from('submissions')
      .select('submission_id, status')
      .eq('publication_id', Number(publicationId))
      .eq('award_id', Number(awardId))
      .in('status', ['DRAFT', 'RETURNED'])
      .single();

    if (existingDraft) {
      const filePath = `${existingDraft.submission_id}_form43.pdf`;

      const { data: urlData } = await supabaseAdmin.storage
        .from('drafts-pdf')
        .createSignedUrl(filePath, 3600);

      if (urlData?.signedUrl) {
        const fileResponse = await fetch(urlData.signedUrl);
        const fileBuffer = await fileResponse.arrayBuffer();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="form43.pdf"');
        return res.send(Buffer.from(fileBuffer));
      }
    }

    const tempPath = `${user_id}_${publicationId}_${awardId}_form43.pdf`;
    try {
      const { data: tempUrlData } = await supabaseAdmin.storage
        .from('drafts-pdf')
        .createSignedUrl(tempPath, 3600);

      if (tempUrlData?.signedUrl) {
        const fileResponse = await fetch(tempUrlData.signedUrl);
        const fileBuffer = await fileResponse.arrayBuffer();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="form43.pdf"');
        return res.send(Buffer.from(fileBuffer));
      }
    } catch (e) {
      // Temp file doesn't exist
    }

    const { data: publication, error: pubError } = await supabase
      .from('publications')
      .select('*')
      .eq('publication_id', publicationId)
      .single();

    if (pubError || !publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    const { data: pubAuthors, error: authorsError } = await supabase
      .from('publication_authors')
      .select('*, users(*)')
      .eq('publication_id', publicationId);

    if (authorsError) {
      console.error('Authors error:', authorsError);
    }

    const authors = pubAuthors?.map(pa => ({
      first_name: pa.first_name || pa.users?.first_name || "",
      last_name: pa.last_name || pa.users?.last_name || "",
      middle_name: pa.middle_name || pa.users?.middle_name || "",
      department: pa.department || pa.users?.department || "",
    })) || [];

    const templatePath = path.join(process.cwd(), 'public', '4.3-template.pdf');
    const buffer = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(buffer);
    const form = pdfDoc.getForm();

    try {
      form.getTextField('title').setText(publication.title || '');

      const citationParts = [
        publication.journal_name,
        publication.volume_number ? `Vol. ${publication.volume_number}` : null,
        publication.issue_number ? `(${publication.issue_number})` : null,
        publication.page_numbers ? `pp. ${publication.page_numbers}` : null,
        publication.date_published ? `(${publication.date_published})` : null,
        publication.doi ? `doi: ${publication.doi}` : null,
      ].filter(Boolean);
      const completeCitation = citationParts.join(', ');
      form.getTextField('citation').setText(completeCitation);

      const firstAuthor = authors[0] || {};
      form.getTextField('department').setText(firstAuthor.department || '');

      for (let i = 0; i < Math.min(authors.length, 6); i++) {
        const author = authors[i];
        if (!author) continue;

        const authorName = author.first_name && author.last_name
          ? `${author.first_name} ${author.last_name}`.trim()
          : '';
        const authorNum = i + 1;

        try {
          form.getTextField(`author${authorNum}-name`).setText(authorName);
        } catch (fieldError) {
          console.warn(`Field author${authorNum}-name not found:`, fieldError);
        }
      }

      form.getTextField('admin-name').setText('');
      form.getTextField('admin-position').setText('');
      form.getTextField('admin-name-2').setText('');
      form.getTextField('admin-position-2').setText('');
      form.getTextField('vice-president-name').setText('');
    } catch (fieldError) {
      console.warn("One or more fields were not found in the PDF:", fieldError);
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="filled-report.pdf"');
    return res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}