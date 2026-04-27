import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleClient();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'key and value are required' });
    }

    const { error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
