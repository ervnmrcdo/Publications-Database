import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ error: 'Missing userId' }, { status: 400 })
  }

  const supabase = await createClient()

  const [
    { count: publicationCount },
    { count: pendingCount },
    { count: validatedCount },
  ] = await Promise.all([
    supabase
      .from('publication_authors')
      .select('publication_id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('submissions')
      .select('submission_id', { count: 'exact', head: true })
      .eq('submitter_id', userId)
      .eq('status', 'PENDING'),
    supabase
      .from('submissions')
      .select('submission_id', { count: 'exact', head: true })
      .eq('submitter_id', userId)
      .eq('status', 'VALIDATED'),
  ])

  return Response.json({
    publicationCount: publicationCount || 0,
    pendingAppCount: pendingCount || 0,
    validCount: validatedCount || 0,
  })
}