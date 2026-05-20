import { createPagesServerClient } from "@/lib/supabase/pager-server"
import { NextApiRequest, NextApiResponse } from "next";

interface PersonnelData {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  position: string | null;
  department: string | null;
  role: string;
  awardApplications: number;
  publications: number;
}

export default async function getPersonnel(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient(req, res);

    const { role, search } = req.query;
    console.log(req.query)

    if (!role || (role !== 'teaching' && role !== 'nonteaching')) {
      return res.status(400).json({ error: 'Invalid role parameter. Use "teaching" or "nonteaching".' });
    }

    let query = supabase
      .from('users')
      .select(`
        id,
        first_name,
        middle_name,
        last_name,
        email,
        position,
        department,
        role
      `)
      .eq('role', role);

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      query = query.or(`first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,position.ilike.%${searchLower}%,department.ilike.%${searchLower}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!users || users.length === 0) {
      return res.status(200).json([]);
    }

    const userIds = users.map(u => u.id);

    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submissions')
      .select('submitter_id')
      .in('submitter_id', userIds)
      .in('status', ['VALIDATED', 'SUBMITTED_TO_HIGHER_OFFICE', 'PROCESSED_BY_HIGHER_OFFICE']);

    if (submissionsError) {
      return res.status(400).json({ error: submissionsError.message });
    }

    const { data: publicationAuthorsData, error: paError } = await supabase
      .from('publication_authors')
      .select('user_id')
      .in('user_id', userIds);

    if (paError) {
      return res.status(400).json({ error: paError.message });
    }

    const submissionsCount: Record<string, number> = {};
    submissionsData?.forEach(sub => {
      if (sub.submitter_id) {
        submissionsCount[sub.submitter_id] = (submissionsCount[sub.submitter_id] || 0) + 1;
      }
    });

    const publicationAuthorsCount: Record<string, number> = {};
    publicationAuthorsData?.forEach(pa => {
      if (pa.user_id) {
        publicationAuthorsCount[pa.user_id] = (publicationAuthorsCount[pa.user_id] || 0) + 1;
      }
    });

    const result: PersonnelData[] = users.map(user => ({
      id: user.id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      email: user.email,
      position: user.position,
      department: user.department,
      role: user.role,
      awardApplications: submissionsCount[user.id] || 0,
      publications: publicationAuthorsCount[user.id] || 0,
    }));

    return res.status(200).json(result);

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: `Server Error: ${errorMessage}` });
  }
}
