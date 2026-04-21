import { NextApiRequest, NextApiResponse } from 'next';
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
    return res.status(400).json({ message: 'awardId must be 1 for form 4.2' });
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
      const filePath = `${existingDraft.submission_id}_form42.docx`;

      const { data: urlData } = await supabaseAdmin.storage
        .from('drafts-docx')
        .createSignedUrl(filePath, 3600);

      if (urlData?.signedUrl) {
        const fileResponse = await fetch(urlData.signedUrl);
        const fileBuffer = await fileResponse.arrayBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'inline; filename="form42.docx"');
        return res.send(Buffer.from(fileBuffer));
      }
    }

    const tempPath = `${user_id}_${publicationId}_${awardId}_form42.docx`;
    try {
      const { data: tempUrlData } = await supabaseAdmin.storage
        .from('drafts-docx')
        .createSignedUrl(tempPath, 3600);

      if (tempUrlData?.signedUrl) {
        const fileResponse = await fetch(tempUrlData.signedUrl);
        const fileBuffer = await fileResponse.arrayBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'inline; filename="form42.docx"');
        return res.send(Buffer.from(fileBuffer));
      }
    } catch (e) {
      // Temp file doesn't exist
    }

    const templatePath = path.join(process.cwd(), 'public', '4.2-template.docx');
    const buffer = fs.readFileSync(templatePath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'inline; filename="4.2-template.docx"');
    return res.send(buffer);

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}
