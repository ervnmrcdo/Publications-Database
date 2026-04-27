import { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const supabase = createServiceRoleClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('signature_path')
      .eq('id', user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasSignature = !!user.signature_path;

    return res.status(200).json({ hasSignature });
  } catch (err) {
    console.error('Error checking signature:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
