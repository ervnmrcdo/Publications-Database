import { createPagesServerClient } from '@/lib/supabase/pager-server';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handleTagging(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const { userId } = req.query
      const SUPABASE = createPagesServerClient(req, res);
      const { data, error } = await SUPABASE.from('users')
        .select('id, first_name, middle_name, last_name')
        .neq('role', 'admin')
        .neq('id', userId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data || [] });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  if (req.method === "PUT") {
    try {
      const SUPABASE = createPagesServerClient(req, res);
      const { publicationId, userId, taggedAuthors } = req.body;

      if (!publicationId || !userId) {
        return res.status(400).json({ error: 'Missing publicationId or userId' });
      }

      const taggedAuthorsWithOwner = taggedAuthors ? [...taggedAuthors, userId] : [userId];

      const { data, error } = await SUPABASE
        .from('publication_authors')
        .update({ tagged_authors: taggedAuthorsWithOwner })
        .eq('publication_id', publicationId)
        .eq('user_id', userId)
        .select();


      const { data: currentlyLinkedAuthors, error: fetchError } = await SUPABASE
        .from('publication_authors')
        .select('user_id')
        .eq('publication_id', publicationId)

      const currentAuthorIds = currentlyLinkedAuthors?.map(author => author.user_id).filter(author => author !== userId) || []

      const toAddAuthors = taggedAuthors?.filter((authorId: any) => !currentAuthorIds.includes(authorId))
      const toRemoveAuthors = currentAuthorIds?.filter((authorId: any) => !taggedAuthors.includes(authorId))

      if (toAddAuthors) {
        for (const authorId of toAddAuthors) {
          await SUPABASE
            .from('publication_authors')
            .insert([{
              publication_id: publicationId,
              user_id: authorId,
              tagged_authors: taggedAuthorsWithOwner,
            }])
            .select()
        }
      }

      if (toRemoveAuthors) {
        for (const authorId of toRemoveAuthors) {
          await SUPABASE
            .from('publication_authors')
            .delete()
            .eq('publication_id', publicationId)
            .eq('user_id', authorId)
        }
      }



      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
