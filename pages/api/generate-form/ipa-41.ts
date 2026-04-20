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
  if (!awardId || awardIdNum !== 1) {
    return res.status(400).json({ message: 'awardId must be 1 for form 4.1' });
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
      const filePath = `${existingDraft.submission_id}_form41.pdf`;

      const { data: urlData } = await supabaseAdmin.storage
        .from('drafts-pdf')
        .createSignedUrl(filePath, 3600);

      if (urlData?.signedUrl) {
        const fileResponse = await fetch(urlData.signedUrl);
        const fileBuffer = await fileResponse.arrayBuffer();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="form41.pdf"');
        return res.send(Buffer.from(fileBuffer));
      }
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
      university: pa.university || pa.users?.university || "",
      college: pa.college || pa.users?.college || "",
      department: pa.department || pa.users?.department || "",
      position: pa.position || pa.users?.position || "",
      contact_number: pa.contact_number || pa.users?.contact_number || "",
      email_address: pa.email_address || pa.users?.email_address || "",
    })) || [];

    const firstAuthor = authors[0] || {};
    console.dir(firstAuthor, { depth: null })
    const totalAuthors = authors.length;

    const citationParts = [
      publication.journal_name,
      publication.volume_number ? `Vol. ${publication.volume_number}` : null,
      publication.issue_number ? `(${publication.issue_number})` : null,
      publication.page_numbers ? `pp. ${publication.page_numbers}` : null,
      publication.date_published ? `(${publication.date_published})` : null,
      publication.doi ? `doi: ${publication.doi}` : null,
    ].filter(Boolean);
    const completeCitation = citationParts.join(', ');

    const templatePath = path.join(process.cwd(), 'public', '4.1-template-new.pdf');
    const buffer = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(buffer);
    const form = pdfDoc.getForm();

    try {
      form.getTextField('article-title').setText(publication.title || '');
      form.getTextField('complete-citation').setText(completeCitation);
      form.getTextField('journal-name').setText(publication.journal_name || '');
      form.getTextField('date-of-publication').setText(publication.date_published || '');
      form.getTextField('publisher-name').setText(publication.publisher || '');
      form.getTextField('total-author-number').setText(String(totalAuthors));

      const author1Name = firstAuthor.first_name && firstAuthor.last_name
        ? `${firstAuthor.first_name} ${firstAuthor.middle_name || ''} ${firstAuthor.last_name}`.replace(/\s+/g, ' ').trim()
        : '';
      const author1NameLastFirst = firstAuthor.last_name && firstAuthor.first_name
        ? `${firstAuthor.last_name}, ${firstAuthor.first_name}${firstAuthor.middle_name ? ' ' + firstAuthor.middle_name : ''}`
        : '';
      const author1UniversityAndDept = firstAuthor.university && firstAuthor.department
        ? `${firstAuthor.university} - ${firstAuthor.department}`
        : firstAuthor.university || '';

      form.getTextField('author1-name-last-first').setText(author1NameLastFirst);

      form.getTextField('author1-name').setText(author1Name);
      form.getTextField('author1-university-and-dept').setText(author1UniversityAndDept);
      form.getTextField('author1-university').setText(firstAuthor.university || '');
      form.getTextField('author1-college').setText(firstAuthor.college || '');
      form.getTextField('author1-department').setText(firstAuthor.department || '');
      form.getTextField('author1-contact').setText(firstAuthor.contact_number || '');
      form.getTextField('author1-position').setText(firstAuthor.position || '');
      form.getTextField('author1-email').setText(firstAuthor.email_address || '');
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
