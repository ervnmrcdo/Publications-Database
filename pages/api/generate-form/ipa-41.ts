import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { createPagesServerClient } from '@/lib/supabase/pager-server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const MAX_MAIN_FORM_AUTHORS = 6;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { publicationId, awardId, user_id, adminId } = req.query;

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

    const tempPath = `${user_id}_${publicationId}_${awardId}_form41.pdf`;
    try {
      const { data: tempUrlData } = await supabaseAdmin.storage
        .from('drafts-pdf')
        .createSignedUrl(tempPath, 3600);

      if (tempUrlData?.signedUrl) {
        const fileResponse = await fetch(tempUrlData.signedUrl);
        const fileBuffer = await fileResponse.arrayBuffer();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="form41.pdf"');
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
      university: pa.university || pa.users?.university || "",
      college: pa.college || pa.users?.college || "",
      department: pa.department || pa.users?.department || "",
      position: pa.position || pa.users?.position || "",
      contact_number: pa.contact_number || pa.users?.contact_number || "",
      email_address: pa.email_address || pa.users?.email_address || "",
    })) || [];

    const firstAuthor = authors[0] || {};

    let adminUser = null;
    let adminSignature = null;
    if (adminId) {
      const { data: adminData } = await supabase
        .from('users')
        .select('first_name, middle_name, last_name, position, signature_path')
        .eq('id', adminId)
        .single();
      adminUser = adminData;
      
      if (adminData?.signature_path) {
        const { data: sigData, error: sigError } = await supabaseAdmin.storage
          .from('signatures')
          .download(adminData.signature_path);
        if (!sigError && sigData) {
          adminSignature = Buffer.from(await sigData.arrayBuffer());
        }
      }
    }

    const totalAuthors = authors.length;
    console.log('Total authors:', totalAuthors);

    const citationParts = [
      publication.journal_name,
      publication.volume_number ? `Vol. ${publication.volume_number}` : null,
      publication.issue_number ? `(${publication.issue_number})` : null,
      publication.page_numbers ? `pp. ${publication.page_numbers}` : null,
      publication.date_published ? `(${publication.date_published})` : null,
      publication.doi ? `doi: ${publication.doi}` : null,
    ].filter(Boolean);
    const completeCitation = citationParts.join(', ');

    const templatePath = path.join(process.cwd(), 'public', '4.1-template.pdf');
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

      for (let i = 1; i < Math.min(totalAuthors, MAX_MAIN_FORM_AUTHORS); i++) {
        const author = authors[i];
        if (!author) break;

        const authorName = author.first_name && author.last_name
          ? `${author.first_name} ${author.middle_name || ''} ${author.last_name}`.replace(/\s+/g, ' ').trim()
          : '';
        const authorNameLastFirst = author.last_name && author.first_name
          ? `${author.last_name}, ${author.first_name}${author.middle_name ? ' ' + author.middle_name : ''}`
          : '';
        const authorUniversityAndDept = author.university && author.department
          ? `${author.university} - ${author.department}`
          : author.university || '';

        const authorNum = i + 1;

        try {
          form.getTextField(`author${authorNum}-name-last-first`).setText(authorNameLastFirst);
          form.getTextField(`author${authorNum}-university-and-dept`).setText(authorUniversityAndDept);
        } catch (fieldError) {
          console.warn(`Field for author${authorNum} not found in PDF:`, fieldError);
        }
      }
    } catch (fieldError) {
      console.warn("One or more fields were not found in the PDF:", fieldError);
    }

    // Fill admin fields if adminId provided
    if (adminUser) {
      try {
        const adminName = [adminUser.first_name, adminUser.middle_name, adminUser.last_name]
          .filter(Boolean).join(' ').trim();
        form.getTextField('admin-name').setText(adminName);
        
        const todayDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Asia/Manila'
        });
        form.getTextField('admin-sign-date').setText(todayDate);
      } catch (adminFieldError) {
        console.warn("Admin field not found:", adminFieldError);
      }
      
      if (adminSignature) {
        try {
          const signatureImage = await pdfDoc.embedPng(adminSignature);
          
          try {
            const sigField = form.getButton('admin-signature_af_image');
            if (sigField) {
              sigField.setImage(signatureImage);
            }
          } catch (buttonError) {
            console.warn("Signature button field not found, trying drawImage:", buttonError);
            const signatureDims = signatureImage.scale(0.15);
            const pages = pdfDoc.getPages();
            const lastPage = pages[pages.length - 1];
            const { height } = lastPage.getSize();
            lastPage.drawImage(signatureImage, {
              x: 50,
              y: height - 100,
              height: signatureDims.height,
              width: signatureDims.width,
            });
          }
        } catch (sigError) {
          console.warn("Failed to embed signature:", sigError);
        }
      }
    }

    if (totalAuthors > 1) {
      try {
        for (let i = 1; i < totalAuthors; i++) {
          const author = authors[i];
          console.log(author)
          if (!author) continue;

          const extraTemplatePath = path.join(process.cwd(), 'public', '4.x-extra-page.pdf');
          const extraBuffer = fs.readFileSync(extraTemplatePath);
          const extraPdfDoc = await PDFDocument.load(extraBuffer);
          const extraForm = extraPdfDoc.getForm();

          const authorNum = i + 1;

          const authorName = author.first_name && author.last_name
            ? `${author.first_name} ${author.middle_name || ''} ${author.last_name}`.replace(/\s+/g, ' ').trim()
            : '';

          console.log('Adding extra page for author', authorNum + ':', authorName);

          try {
            extraForm.getTextField('applicant-number').setText(String(authorNum));
            extraForm.getTextField('author-name').setText(authorName);
            extraForm.getTextField('author-university').setText(author.university || '');
            extraForm.getTextField('author-college').setText(author.college || '');
            extraForm.getTextField('author-department').setText(author.department || '');
            extraForm.getTextField('author-contact').setText(author.contact_number || '');
            extraForm.getTextField('author-position').setText(author.position || '');
            extraForm.getTextField('author-email').setText(author.email_address || '');

            // Save to render form changes to page content
            const filledExtraBytes = await extraPdfDoc.save();

            // Reload and copy
            const tempPdfDoc = await PDFDocument.load(filledExtraBytes);
            const [copiedPage] = await pdfDoc.copyPages(tempPdfDoc, [0]);
            const pageCount = pdfDoc.getPageCount();
            pdfDoc.insertPage(pageCount - 1, copiedPage);
          } catch (fillError) {
            console.warn(`Error filling extra page for author${authorNum}:`, fillError);
          }
        }
      } catch (extraPageError) {
        console.warn("Error adding extra pages:", extraPageError);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const initialDraftPath = `${user_id}_${publicationId}_${awardId}_form41.pdf`;
    try {
      await supabaseAdmin.storage
        .from('drafts-pdf')
        .upload(initialDraftPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });
    } catch (uploadError) {
      console.warn('Failed to save initial draft to bucket:', uploadError);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="form41.pdf"');
    return res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}
