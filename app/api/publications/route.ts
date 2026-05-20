import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ error: 'Missing userId' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('publication_authors')
    .select(`
      publication_id,
      publications (
        publication_id,
        book_or_journal,
        title,
        publisher,
        publication_status,
        date_published,
        issue_number,
        page_numbers,
        volume_number,
        journal_name,
        doi
      )
    `)
    .eq('user_id', userId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  type PublicationAuthorRow = {
    publications: Record<string, unknown> | Record<string, unknown>[] | null
  }

  const pubs = (data as PublicationAuthorRow[])
    .flatMap((row) => Array.isArray(row.publications) ? row.publications : [row.publications])
    .filter((pub): pub is Record<string, unknown> => Boolean(pub))

  return Response.json(pubs)
}