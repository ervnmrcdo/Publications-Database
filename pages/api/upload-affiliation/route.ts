import { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { user_id, file_name, file_data } = req.body;

    if (!user_id || !file_name || !file_data) {
      return res.status(400).json({ error: 'user_id, file_name, and file_data are required' });
    }

    const supabaseAdmin = createServiceRoleClient();
    const cleanFileName = file_name.replace(/\.\./g, '').replace(/[<>:"/\\|?*]/g, '_');
    const filePath = `${user_id}/${cleanFileName}`;
    const buffer = Buffer.from(file_data, 'base64');

    const ext = cleanFileName.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const { error } = await supabaseAdmin.storage
      .from('proof-of-affiliation')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, path: filePath });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
