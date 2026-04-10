import { createPagesServerClient } from '@/lib/supabase/pager-server';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handleTagging(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const SUPABASE = createPagesServerClient(req, res);
      const { data, error } = await SUPABASE.from('users')
        .select('id, first_name, middle_name, last_name')
        .neq('role', 'admin');

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data || [] });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  if (req.method === "PUT") {
    return res.status(501).json({ message: 'Not implemented' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
