import { createPagesServerClient } from "@/lib/supabase/pager-server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(403).json({ message: 'Forbidden Method' })
  }
  try {

    const SUPABASE = createPagesServerClient(req, res);
    const { publicationId, userId } = req.query


    const { data: data, error: fetchError } = await SUPABASE.from('publication_authors')
      .select('tagged_authors')
      .eq('publication_id', publicationId)

    if (!data && fetchError) {
      console.log(fetchError)
      return res.status(400).json({ fetchError })
    }

    const TAGGED_AUTHORS = data?.map((fetchedTags: any) => fetchedTags.tagged_authors)[0].filter((authorIds: any) => authorIds !== userId)
    if (!TAGGED_AUTHORS) {
      return res.status(200).json({ TAGGED_AUTHORS })
    }

    const { data: taggedUserData, error: userDataFetchError } = await SUPABASE.from('users')
      .select('id, first_name, middle_name, last_name')
      .in('id', TAGGED_AUTHORS)

    if (userDataFetchError) {
      return res.status(400).json({ message: userDataFetchError })
    }


    return res.status(200).json(taggedUserData)
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}
