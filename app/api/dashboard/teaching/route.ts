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
    { data: validatedData },
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
      .select('submission_id, status')
      .eq('submitter_id', userId)
      .in('status', ['VALIDATED', 'SUBMITTED_TO_HIGHER_OFFICE', 'PROCESSED_BY_HIGHER_OFFICE']),
  ])

  const completedCount = validatedData?.length || 0
  const validCount = validatedData?.filter((s: any) => s.status === 'VALIDATED').length || 0

  return Response.json({
    publicationCount: publicationCount || 0,
    pendingAppCount: pendingCount || 0,
    completedCount,
    validCount,
  })
}